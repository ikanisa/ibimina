const BG_SYNC_TAG = "ibimina-offline-sync";

type SyncManager = {
  register: (tag: string) => Promise<void>;
};

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.warn("offline.sync.ready_failed", error);
    return null;
  }
}

export async function requestBackgroundSync() {
  const registration = await getRegistration();
  if (!registration) {
    return false;
  }

  const syncManager = (registration as ServiceWorkerRegistration & { sync?: SyncManager }).sync;
  if (syncManager) {
    try {
      await syncManager.register(BG_SYNC_TAG);
      return true;
    } catch (error) {
      console.warn("offline.sync.register_failed", error);
    }
  }

  registration.active?.postMessage({ type: "OFFLINE_QUEUE_REGISTER" });
  return false;
}

export async function notifyOfflineQueueUpdated(count: number) {
  const registration = await getRegistration();
  registration?.active?.postMessage({ type: "OFFLINE_QUEUE_UPDATED", count });
}

export async function requestImmediateOfflineSync(reason: string) {
  const registration = await getRegistration();
  registration?.active?.postMessage({ type: "OFFLINE_QUEUE_PROCESS", reason });
}

export async function resetAuthCache() {
  const registration = await getRegistration();
  registration?.active?.postMessage({ type: "AUTH_CACHE_RESET" });
}
