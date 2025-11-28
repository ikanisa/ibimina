import { load, type Store } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
  priority: 'high' | 'normal' | 'low';
  version?: number;
}

interface SyncState {
  lastSyncTimestamp: number;
  pendingChanges: number;
  syncInProgress: boolean;
  conflictsResolved: number;
}

interface ConflictResolution {
  strategy: 'server-wins' | 'client-wins' | 'manual';
  mergedData?: Record<string, unknown>;
}

export class OfflineSyncEngine {
  private store: Store | null = null;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private abortController: AbortController | null = null;
  private maxQueueSize = 1000;
  private maxDeadLetterSize = 100;
  private initialized: Promise<void>;

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string
  ) {
    this.initialized = this.init();
  }
  
  private async init(): Promise<void> {
    this.store = await load('offline-data.json', { defaults: {} });
    this.setupConnectivityListeners();
    await this.loadSyncQueue();
  }
  
  private async ensureInitialized(): Promise<Store> {
    await this.initialized;
    if (!this.store) {
      throw new Error('Store not initialized');
    }
    return this.store;
  }

  private async setupConnectivityListeners(): Promise<void> {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('connectivity-change', { online: true });
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('connectivity-change', { online: false });
      // Cancel ongoing sync
      this.abortController?.abort();
    });

    // Listen for sync requests from system tray
    await listen('sync-requested', () => {
      this.forceSync();
    });
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const store = await this.ensureInitialized();
      const queue = await store.get<SyncQueueItem[]>('sync-queue');
      this.syncQueue = queue || [];
      
      // Clean up old queue items (older than 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.syncQueue = this.syncQueue.filter(item => item.timestamp > sevenDaysAgo);
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      // Enforce queue size limit
      if (this.syncQueue.length > this.maxQueueSize) {
        const overflow = this.syncQueue.slice(this.maxQueueSize);
        await this.moveToDeadLetter(overflow, 'Queue overflow');
        this.syncQueue = this.syncQueue.slice(0, this.maxQueueSize);
      }
      
      const store = await this.ensureInitialized();
      await store.set('sync-queue', this.syncQueue);
      await store.save();
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Queue a change for syncing
  async queueChange(
    table: string,
    operation: SyncQueueItem['operation'],
    data: Record<string, unknown>,
    priority: SyncQueueItem['priority'] = 'normal'
  ): Promise<string> {
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      table,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
      priority,
      version: (data.version as number) || 1,
    };

    this.syncQueue.push(item);
    await this.saveSyncQueue();

    // Immediately sync if online
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue();
    }

    this.emit('queue-updated', { pending: this.syncQueue.length });
    return item.id;
  }

  // Process the sync queue with cancellation support
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.abortController = new AbortController();
    this.emit('sync-started', { pending: this.syncQueue.length });

    const supabase = createClient(this.supabaseUrl, this.supabaseKey);
    const sortedQueue = [...this.syncQueue].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || a.timestamp - b.timestamp;
    });

    const processed: string[] = [];
    const failed: SyncQueueItem[] = [];
    let conflictsResolved = 0;

    for (const item of sortedQueue) {
      // Check if sync was cancelled
      if (this.abortController.signal.aborted) {
        break;
      }

      try {
        const resolved = await this.syncItem(supabase, item);
        if (resolved) {
          conflictsResolved++;
        }
        processed.push(item.id);
      } catch (error) {
        console.error(`Sync failed for ${item.id}:`, error);
        
        item.retries++;
        if (item.retries < 3) {
          failed.push(item);
        } else {
          // Move to dead letter queue after 3 retries
          await this.moveToDeadLetter([item], error);
        }
      }
    }

    // Update queue
    this.syncQueue = failed;
    await this.saveSyncQueue();

    // Update last sync timestamp
    const store = await this.ensureInitialized();
    await store.set('last-sync-timestamp', Date.now());
    await store.save();

    this.syncInProgress = false;
    this.abortController = null;
    
    this.emit('sync-completed', {
      processed: processed.length,
      failed: failed.length,
      remaining: this.syncQueue.length,
      conflictsResolved,
    });
  }

  private async syncItem(
    supabase: SupabaseClient,
    item: SyncQueueItem
  ): Promise<boolean> {
    let conflictResolved = false;

    switch (item.operation) {
      case 'INSERT': {
        const { error: insertError } = await supabase
          .from(item.table)
          .insert(item.data as Record<string, unknown>);
        if (insertError) throw insertError;
        break;
      }

      case 'UPDATE': {
        // Implement optimistic locking
        const itemId = item.data.id as string;
        const { data: current, error: fetchError } = await supabase
          .from(item.table)
          .select('version, updated_at')
          .eq('id', itemId)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        // Conflict detection
        const currentVersion = (current as { version?: number } | null)?.version;
        if (current && currentVersion !== undefined && currentVersion > (item.version || 0)) {
          const resolution = await this.resolveConflict(item, current as Record<string, unknown>);
          
          if (resolution.strategy === 'server-wins') {
            // Discard local changes
            return false;
          } else if (resolution.strategy === 'manual') {
            // Use merged data
            item.data = resolution.mergedData || item.data;
          }
          conflictResolved = true;
        }

        // Increment version
        const updateData = {
          ...item.data,
          version: ((item.version || 0) + 1),
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from(item.table)
          .update(updateData)
          .eq('id', itemId);
        
        if (updateError) throw updateError;
        break;
      }

      case 'DELETE': {
        const itemId = item.data.id as string;
        const { error: deleteError } = await supabase
          .from(item.table)
          .delete()
          .eq('id', itemId);
        if (deleteError) throw deleteError;
        break;
      }
    }

    return conflictResolved;
  }

  private async resolveConflict(
    localItem: SyncQueueItem,
    serverData: Record<string, unknown>
  ): Promise<ConflictResolution> {
    // Default: server wins strategy
    // In production, you might want to show a UI for manual resolution
    const strategy: ConflictResolution['strategy'] = 'server-wins';
    
    // Log conflict for analysis
    console.warn('Sync conflict detected:', {
      table: localItem.table,
      localVersion: localItem.version,
      serverVersion: serverData.version,
      strategy,
    });

    this.emit('sync-conflict', {
      table: localItem.table,
      localData: localItem.data,
      serverData,
      resolution: strategy,
    });

    return { strategy };
  }

  private async moveToDeadLetter(
    items: SyncQueueItem[] | SyncQueueItem,
    error: unknown
  ): Promise<void> {
    const itemsArray = Array.isArray(items) ? items : [items];
    
    try {
      const store = await this.ensureInitialized();
      const deadLetter = await store.get<SyncQueueItem[]>('dead-letter') || [];
      
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 'Unknown error';
      
      const enrichedItems = itemsArray.map(item => ({
        ...item,
        data: {
          ...item.data,
          _error: errorMessage,
          _failedAt: Date.now(),
        },
      }));

      deadLetter.push(...enrichedItems);
      
      // Enforce dead letter size limit
      const trimmed = deadLetter.slice(-this.maxDeadLetterSize);
      
      await store.set('dead-letter', trimmed);
      await store.save();

      this.emit('sync-failed', { items: itemsArray, error: errorMessage });
    } catch (storeError) {
      console.error('Failed to save to dead letter queue:', storeError);
    }
  }

  // Force immediate sync
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    await this.processSyncQueue();
  }

  // Get current sync state
  async getSyncState(): Promise<SyncState> {
    const store = await this.ensureInitialized();
    const lastSync = await store.get<number>('last-sync-timestamp') || 0;
    return {
      lastSyncTimestamp: lastSync,
      pendingChanges: this.syncQueue.length,
      syncInProgress: this.syncInProgress,
      conflictsResolved: 0,
    };
  }

  // Cache data locally with encryption
  async cacheData(key: string, data: unknown): Promise<void> {
    const store = await this.ensureInitialized();
    try {
      // Encrypt sensitive data before storing
      const encrypted = await invoke<string>('encrypt_data', { 
        data: JSON.stringify(data) 
      });
      
      await store.set(`cache:${key}`, {
        data: encrypted,
        timestamp: Date.now(),
        encrypted: true,
      });
      await store.save();
    } catch (error) {
      // Fallback to unencrypted storage if encryption fails
      console.warn('Encryption failed, storing unencrypted:', error);
      await store.set(`cache:${key}`, {
        data,
        timestamp: Date.now(),
        encrypted: false,
      });
      await store.save();
    }
  }

  // Get cached data with decryption
  async getCachedData<T>(key: string): Promise<{ data: T; timestamp: number } | null> {
    const store = await this.ensureInitialized();
    const cached = await store.get<{ 
      data: unknown; 
      timestamp: number; 
      encrypted?: boolean 
    }>(`cache:${key}`);
    
    if (!cached) return null;

    try {
      if (cached.encrypted) {
        const decrypted = await invoke<string>('decrypt_data', { 
          data: cached.data 
        });
        return {
          data: JSON.parse(decrypted) as T,
          timestamp: cached.timestamp,
        };
      } else {
        return {
          data: cached.data as T,
          timestamp: cached.timestamp,
        };
      }
    } catch (error) {
      console.error('Failed to decrypt cached data:', error);
      return null;
    }
  }

  // Clear all cached data
  async clearCache(): Promise<void> {
    const store = await this.ensureInitialized();
    const keys = await store.keys();
    const cacheKeys = keys.filter(k => k.startsWith('cache:'));
    
    for (const key of cacheKeys) {
      await store.delete(key);
    }
    
    await store.save();
  }

  // Get dead letter queue for manual review
  async getDeadLetterQueue(): Promise<SyncQueueItem[]> {
    const store = await this.ensureInitialized();
    return await store.get<SyncQueueItem[]>('dead-letter') || [];
  }

  // Retry items from dead letter queue
  async retryDeadLetter(itemIds?: string[]): Promise<void> {
    const deadLetter = await this.getDeadLetterQueue();
    
    const itemsToRetry = itemIds 
      ? deadLetter.filter(item => itemIds.includes(item.id))
      : deadLetter;
    
    // Move back to sync queue
    this.syncQueue.push(...itemsToRetry.map(item => ({
      ...item,
      retries: 0,
      data: {
        ...item.data,
        _error: undefined,
        _failedAt: undefined,
      },
    })));
    
    // Remove from dead letter
    const remaining = deadLetter.filter(
      item => !itemsToRetry.some(retry => retry.id === item.id)
    );
    
    const store = await this.ensureInitialized();
    await store.set('dead-letter', remaining);
    await this.saveSyncQueue();
  }

  // Event system
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // Clean up resources
  async dispose(): Promise<void> {
    this.abortController?.abort();
    this.listeners.clear();
    const store = await this.ensureInitialized();
    await store.save();
  }
}

// Create singleton instance
let syncEngine: OfflineSyncEngine | null = null;

export function getSyncEngine(): OfflineSyncEngine {
  if (!syncEngine) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    
    syncEngine = new OfflineSyncEngine(url, key);
  }
  return syncEngine;
}
