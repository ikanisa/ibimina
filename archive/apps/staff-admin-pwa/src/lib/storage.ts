import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AppDB extends DBSchema {
  'api-cache': {
    key: string;
    value: {
      url: string;
      data: unknown;
      timestamp: number;
    };
  };
  'offline-queue': {
    key: number;
    value: {
      id: number;
      url: string;
      method: string;
      data: unknown;
      headers: Record<string, string>;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'staff-admin-pwa';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<AppDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<AppDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<AppDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('api-cache')) {
        db.createObjectStore('api-cache', { keyPath: 'url' });
      }

      if (!db.objectStoreNames.contains('offline-queue')) {
        const queueStore = db.createObjectStore('offline-queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        queueStore.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
};

export const cacheApiResponse = async (url: string, data: unknown): Promise<void> => {
  const db = await initDB();
  await db.put('api-cache', {
    url,
    data,
    timestamp: Date.now(),
  });
};

export const getCachedApiResponse = async (url: string): Promise<unknown | null> => {
  const db = await initDB();
  const cached = await db.get('api-cache', url);

  if (!cached) return null;

  const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
  if (Date.now() - cached.timestamp > CACHE_MAX_AGE) {
    await db.delete('api-cache', url);
    return null;
  }

  return cached.data;
};

export const clearApiCache = async (): Promise<void> => {
  const db = await initDB();
  await db.clear('api-cache');
};

export interface OfflineQueueItem {
  id?: number;
  url: string;
  method: string;
  data: unknown;
  headers: Record<string, string>;
  timestamp: number;
}

export const addToOfflineQueue = async (item: Omit<OfflineQueueItem, 'id'>): Promise<void> => {
  const db = await initDB();
  await db.add('offline-queue', item);
};

export const getOfflineQueue = async (): Promise<OfflineQueueItem[]> => {
  const db = await initDB();
  return db.getAllFromIndex('offline-queue', 'by-timestamp');
};

export const removeFromOfflineQueue = async (id: number): Promise<void> => {
  const db = await initDB();
  await db.delete('offline-queue', id);
};

export const clearOfflineQueue = async (): Promise<void> => {
  const db = await initDB();
  await db.clear('offline-queue');
};
