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

      console.log('Successfully synced offline request:', item.url);
    } catch (error) {
      console.error('Failed to sync offline request:', item.url, error);
    }
  }
};

export const setupBackgroundSync = (): void => {
  if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
    window.addEventListener('online', () => {
      navigator.serviceWorker.ready.then((registration) => {
        (registration as any).sync.register('sync-offline-queue').catch((err: Error) => {
          console.warn('Background sync registration failed:', err);
          processOfflineQueue();
        });
      });
    });
  } else {
    window.addEventListener('online', processOfflineQueue);
  }
};
