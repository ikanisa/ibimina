import type { StorageAdapter } from '@ibimina/admin-core/adapters';
import { Store } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';

export class TauriStorage implements StorageAdapter {
  private storePromise: Promise<Store>;

  constructor() {
    // Store.load() is async in Tauri v2
    this.storePromise = Store.load('ibimina-store.json');
  }

  async get<T>(key: string): Promise<T | null> {
    const store = await this.storePromise;
    const value = await store.get<T>(key);
    return value ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const store = await this.storePromise;
    await store.set(key, value);
    await store.save();
  }

  async remove(key: string): Promise<void> {
    const store = await this.storePromise;
    await store.delete(key);
    await store.save();
  }

  async clear(): Promise<void> {
    const store = await this.storePromise;
    await store.clear();
    await store.save();
  }

  async keys(): Promise<string[]> {
    const store = await this.storePromise;
    return await store.keys();
  }

  secure = {
    get: async (key: string): Promise<string | null> => {
      try {
        const creds = await invoke<{ username: string; token: string } | null>(
          'get_secure_credentials',
          { key },
        );
        return creds?.token ?? null;
      } catch (error) {
        console.error('Failed to get secure credentials:', error);
        return null;
      }
    },

    set: async (key: string, value: string): Promise<void> => {
      await invoke('set_secure_credentials', {
        key,
        credentials: { username: key, token: value },
      });
    },

    remove: async (key: string): Promise<void> => {
      await invoke('delete_secure_credentials', { key });
    },
  };
}
