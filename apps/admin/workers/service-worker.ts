/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches, type PrecacheEntry } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { StaleWhileRevalidate, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry>;
};

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev-build";
const OFFLINE_URL = "/offline";

self.skipWaiting();
clientsClaim();

precacheAndRoute(
  [
    ...(self.__WB_MANIFEST ?? []),
    { url: OFFLINE_URL, revision: BUILD_ID },
  ],
  {
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  },
);

cleanupOutdatedCaches();

registerRoute(
  ({ url }) => url.pathname.startsWith("/_next/static/"),
  new StaleWhileRevalidate({
    cacheName: "next-static-assets",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 128,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ request }) => request.destination === "style" || request.destination === "font",
  new StaleWhileRevalidate({
    cacheName: "static-resources",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "app-shell",
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 32, purgeOnQuotaError: true }),
    ],
  }),
);

registerRoute(
  ({ url }) =>
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/supabase"),
  new NetworkFirst({
    cacheName: "api-routes",
    networkTimeoutSeconds: 6,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200, 204] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 }),
    ],
  }),
);

setCatchHandler(async ({ event }) => {
  const fetchEvent = event as FetchEvent;
  if (fetchEvent.request?.destination === "document") {
    const cached = await caches.match(OFFLINE_URL);
    if (cached) {
      return cached;
    }
  }

  return Response.error();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
