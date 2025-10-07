/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { getQueuedActions, removeQueuedAction } from "./lib/offline-queue-store";
import { processQueuedAction } from "./lib/offline-queue-processor";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

precacheAndRoute(self.__WB_MANIFEST);

const CACHE_NAME = "ibimina-cache-v1";
const OFFLINE_URLS = ["/", "/dashboard", "/ibimina", "/reconciliation", "/reports"]; 

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(OFFLINE_URLS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (request.mode === "navigate") {
          const fallback = await cache.match("/");
          if (fallback) return fallback;
        }
        throw error;
      }
    })(),
  );
});

const flushQueue = async () => {
  const actions = await getQueuedActions();
  let remaining = actions.length;

  for (const action of actions) {
    try {
      await processQueuedAction(action);
      await removeQueuedAction(action.id);
      remaining -= 1;
    } catch (error) {
      console.error("Service worker queue replay failed", error);
      break;
    }
  }

  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clients.forEach((client) => client.postMessage({ type: "QUEUE_FLUSHED", remaining }));
};

self.addEventListener("sync", (event) => {
  if (event.tag === "flush-offline-queue") {
    event.waitUntil(flushQueue());
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "FLUSH_QUEUE") {
    event.waitUntil(flushQueue());
  }
});
