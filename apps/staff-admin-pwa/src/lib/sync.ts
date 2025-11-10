import { getOfflineQueue, removeFromOfflineQueue } from './storage';
import { apiClient } from '@/api/client';

export const processOfflineQueue = async (): Promise<void> => {
  if (!navigator.onLine) {
    return;
  }

  const queue = await getOfflineQueue();

  for (const item of queue) {
    try {
      await apiClient.request({
        method: item.method,
        url: item.url,
        data: item.data,
        headers: item.headers,
      });

      if (item.id) {
        await removeFromOfflineQueue(item.id);
      }
    } catch (error) {
      console.error('Failed to sync offline request:', item.url, error);
    }
  }
};

type SyncCapableRegistration = ServiceWorkerRegistration & {
  sync?: {
    register: (tag: string) => Promise<void>;
  };
};

const hasServiceWorkerRegistration =
  typeof ServiceWorkerRegistration !== 'undefined';

const serviceWorkerPrototype: SyncCapableRegistration | undefined =
  hasServiceWorkerRegistration
    ? (ServiceWorkerRegistration.prototype as SyncCapableRegistration)
    : undefined;

export const setupBackgroundSync = (): void => {
  if (
    'serviceWorker' in navigator &&
    serviceWorkerPrototype &&
    'sync' in serviceWorkerPrototype
  ) {
    window.addEventListener('online', () => {
      navigator.serviceWorker.ready.then((registration) => {
        const syncCapableRegistration = registration as SyncCapableRegistration;
        const sync = syncCapableRegistration.sync;

        if (sync?.register) {
          sync
            .register('sync-offline-queue')
            .then(() => {
              processOfflineQueue();
            })
            .catch((err: Error) => {
              console.warn('Background sync registration failed:', err);
              processOfflineQueue();
            });
        } else {
          processOfflineQueue();
        }
      });
    });
  } else {
    window.addEventListener('online', processOfflineQueue);
  }
};
