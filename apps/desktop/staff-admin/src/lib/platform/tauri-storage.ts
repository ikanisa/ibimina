import type { StorageAdapter } from '@ibimina/admin-core/adapters';
import { Store } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';

export class TauriStorage implements StorageAdapter {
  private store: Store;

  constructor() {
    this.store = new Store('ibimina-store.json');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.store.get<T>(key);
    return value ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.store.set(key, value);
    await this.store.save();
  }

  async remove(key: string): Promise<void> {
    await this.store.delete(key);
    await this.store.save();
  }

  async clear(): Promise<void> {
    await this.store.clear();
    await this.store.save();
  }

  async keys(): Promise<string[]> {
    return await this.store.keys();
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
