/// <reference lib="webworker" />

/**
 * Service Worker for Ibimina Client App PWA
 *
 * This service worker implements a comprehensive caching strategy to ensure
 * the application works offline and provides optimal performance.
 *
 * Caching Strategies:
 * - Precaching: Critical app shell resources are cached at install time
 * - Stale-While-Revalidate (SWR): For static assets that can be served from cache
 *   while being updated in the background
 * - Network-First: For pages and API data to ensure fresh content when online
 * - Cache-First: For fonts and icons that rarely change
 *
 * Accessibility: Includes offline fallback page that adheres to WCAG 2.1 AA standards
 *
 * @see https://developer.chrome.com/docs/workbox/
 */

import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches, type PrecacheEntry } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { enable as enableNavigationPreload } from "workbox-navigation-preload";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry>;
};

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev-build";
const OFFLINE_URL = "/offline";
const PRECACHE_MAX_ENTRIES = 120;
const PRECACHE_MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5 MiB budget

type LogLevel = "info" | "warn" | "error";

const logSwEvent = (level: LogLevel, event: string, payload?: Record<string, unknown>) => {
  const entry = {
    level,
    event,
    source: "service-worker",
    timestamp: new Date().toISOString(),
    ...(payload ? { payload } : {}),
  } satisfies Record<string, unknown>;

  const serialized = JSON.stringify(entry);
  switch (level) {
    case "error":
      console.error(serialized);
      break;
    case "warn":
      console.warn(serialized);
      break;
    default:
      // Service worker structured logging (JSON output)
      // eslint-disable-next-line ibimina/structured-logging
      console.log(serialized);
  }
};

const logSwInfo = (event: string, payload?: Record<string, unknown>) =>
  logSwEvent("info", event, payload);
const logSwWarn = (event: string, payload?: Record<string, unknown>) =>
  logSwEvent("warn", event, payload);
const logSwError = (event: string, payload?: Record<string, unknown>) =>
  logSwEvent("error", event, payload);

const estimateEntrySize = (entry: PrecacheEntry): number => {
  const url = entry.url ?? "";
  if (url.endsWith(".js") || url.endsWith(".mjs")) {
    return 180 * 1024;
  }
  if (url.endsWith(".css")) {
    return 48 * 1024;
  }
  if (url.endsWith(".woff2")) {
    return 95 * 1024;
  }
  if (
    url.endsWith(".png") ||
    url.endsWith(".jpg") ||
    url.endsWith(".jpeg") ||
    url.endsWith(".webp")
  ) {
    return 120 * 1024;
  }

  return 24 * 1024;
};

const enforcePrecacheBudget = (entries: Array<PrecacheEntry>) => {
  const accepted: Array<PrecacheEntry> = [];
  const rejected: Array<PrecacheEntry> = [];
  let totalBytes = 0;

  for (const entry of entries) {
    const estimated = estimateEntrySize(entry);
    const withinEntryLimit = accepted.length < PRECACHE_MAX_ENTRIES;
    const withinSizeLimit = totalBytes + estimated <= PRECACHE_MAX_TOTAL_BYTES;

    if (withinEntryLimit && withinSizeLimit) {
      accepted.push(entry);
      totalBytes += estimated;
    } else {
      rejected.push(entry);
    }
  }

  if (rejected.length > 0) {
    logSwWarn("sw.precache_budget_evicted", {
      rejectedCount: rejected.length,
      maxEntries: PRECACHE_MAX_ENTRIES,
      maxKilobytes: Math.round(PRECACHE_MAX_TOTAL_BYTES / 1024),
      estimatedKilobytes: Math.round(totalBytes / 1024),
      rejectedSamples: rejected.slice(0, 5).map((entry) => entry.url),
    });
  }

  logSwInfo("sw.precache_manifest_ready", {
    entries: accepted.length,
    estimatedKilobytes: Math.round(totalBytes / 1024),
  });

  return accepted;
};

// Immediately activate the service worker and take control of all clients
self.skipWaiting();
clientsClaim();

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        await enableNavigationPreload();
      } catch (error) {
        console.error("Failed to enable navigation preload", error);
      }
    })()
  );
});

// Precache critical app shell resources
// The workbox plugin injects the manifest at build time via __WB_MANIFEST
const precacheManifest = enforcePrecacheBudget(self.__WB_MANIFEST ?? []);
precacheAndRoute([...precacheManifest, { url: OFFLINE_URL, revision: BUILD_ID }], {
  // Ignore common tracking parameters that don't affect content
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
});

if (self.registration?.navigationPreload) {
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      self.registration.navigationPreload
        .enable()
        .then(() => {
          logSwInfo("sw.navigation_preload_enabled");
        })
        .catch((error) => {
          logSwWarn("sw.navigation_preload_enable_failed", {
            message: error instanceof Error ? error.message : String(error),
          });
        })
    );
  });

  self.addEventListener("fetch", (event) => {
    if (event.request.mode === "navigate") {
      event.waitUntil(
        (async () => {
          try {
            const response = await event.preloadResponse;
            if (!response) {
              logSwInfo("sw.navigation_preload_miss");
            }
          } catch (error) {
            logSwError("sw.navigation_preload_error", {
              message: error instanceof Error ? error.message : String(error),
            });
          }
        })()
      );
    }
  });
}

// Remove outdated caches from previous versions
cleanupOutdatedCaches();

/**
 * Cache Strategy: Stale-While-Revalidate (SWR) for Next.js static assets
 *
 * These assets (JS, CSS) are hashed and immutable. We serve from cache first
 * for instant loading while revalidating in the background.
 *
 * WCAG 2.1 AA Compliance: Fast loading improves accessibility for users
 * with cognitive disabilities or slow connections.
 */
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
  })
);

/**
 * Cache Strategy: Cache-First for fonts
 *
 * Fonts rarely change and should be served from cache first
 * for optimal performance. This captures font requests via the
 * standard request.destination property.
 *
 * Note: For CDN-hosted fonts, additional URL pattern matching
 * may be needed in a separate route.
 */
registerRoute(
  ({ request }) => request.destination === "font",
  new CacheFirst({
    cacheName: "fonts",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * Helper: Check if request is for an icon
 */
const isIconRequest = ({ request, url }: { request: Request; url: URL }) => {
  return request.destination === "image" && url.pathname.startsWith("/icons/");
};

/**
 * Cache Strategy: Cache-First for icons
 *
 * Application icons should be served from cache for instant loading.
 */
registerRoute(
  isIconRequest,
  new CacheFirst({
    cacheName: "icons",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * Cache Strategy: Stale-While-Revalidate for CSS and other style resources
 *
 * Serve styles from cache for immediate rendering while updating in background.
 */
registerRoute(
  ({ request }) => request.destination === "style",
  new StaleWhileRevalidate({
    cacheName: "static-resources",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * Cache Strategy: Network-First for page navigation
 *
 * For HTML pages, always try the network first to get fresh content.
 * Falls back to cache if network is unavailable (offline mode).
 *
 * This ensures users always see the latest content when online while
 * maintaining offline functionality.
 */
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "app-shell",
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 32, purgeOnQuotaError: true }),
    ],
  })
);

/**
 * Cache Strategy: Network-First for API routes and data
 *
 * API calls should prioritize fresh data from the network.
 * Short-term caching (60 seconds) provides a fallback for offline use
 * and reduces repeated identical requests.
 */
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
  })
);

/**
 * Offline Fallback Handler
 *
 * When all caching strategies fail (e.g., user is offline and resource
 * is not cached), this handler provides a graceful fallback.
 *
 * For document requests, serves the offline page which includes:
 * - Clear messaging about offline status
 * - WCAG 2.1 AA compliant design (contrast ratios, focus indicators)
 * - Actionable options to retry or navigate to cached pages
 */
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

/**
 * Service Worker Message Handler
 *
 * Listens for messages from the client (main app) to control
 * service worker behavior.
 *
 * SKIP_WAITING: Allows the client to force activation of a new service worker
 * version without waiting for all tabs to close.
 */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/**
 * Push Notification Handler
 *
 * Handles incoming push notifications and displays them to the user.
 * Supports rich notifications with actions, icons, and badges.
 *
 * WCAG 2.1 AA Compliance: Notifications are non-intrusive and provide
 * clear, actionable information.
 */
self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || "Ibimina Client";
    const options = {
      body: data.body || "",
      icon: data.icon || "/icons/icon-192.png",
      badge: data.badge || "/icons/icon-192.png",
      data: data.data || {},
      tag: data.tag || "default",
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
    } as NotificationOptions;

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error("Failed to parse or display push notification:", error, {
      hasData: !!event.data,
      dataType: event.data ? typeof event.data : "none",
    });
  }
});

/**
 * Notification Click Handler
 *
 * Handles user interactions with push notifications.
 * Opens the app or focuses an existing window when notification is clicked.
 *
 * Accessibility: Ensures smooth navigation to relevant content.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open with this URL
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
