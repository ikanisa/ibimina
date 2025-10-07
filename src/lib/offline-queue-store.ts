export interface QueuedAction {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string | null;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

const DB_NAME = "ibimina-offline";
const STORE_NAME = "queued-actions";
const DB_VERSION = 1;

const getIndexedDB = () => {
  const indexedDBRef = (globalThis as unknown as { indexedDB?: IDBFactory }).indexedDB;
  if (!indexedDBRef) {
    throw new Error("IndexedDB is not supported in this environment");
  }
  return indexedDBRef;
};

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = getIndexedDB().open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runOnStore = async (mode: IDBTransactionMode, callback: (store: IDBObjectStore) => void) => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      const { error } = transaction;
      db.close();
      reject(error ?? new Error("Transaction failed"));
    };

    try {
      callback(store);
    } catch (error) {
      reject(error);
    }
  });
};

export const enqueueQueuedAction = async (action: QueuedAction): Promise<void> => {
  await runOnStore("readwrite", (store) => {
    store.put(action);
  });
};

export const getQueuedActions = async (): Promise<QueuedAction[]> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();

    transaction.oncomplete = () => {
      db.close();
    };

    request.onsuccess = () => {
      resolve((request.result as QueuedAction[]) ?? []);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to read queued actions"));
    };
  });
};

export const removeQueuedAction = async (id: string): Promise<void> => {
  await runOnStore("readwrite", (store) => {
    store.delete(id);
  });
};

export const clearQueuedActions = async (): Promise<void> => {
  await runOnStore("readwrite", (store) => {
    store.clear();
  });
};
