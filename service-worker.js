const VERSION = "20250314";
const STATIC_CACHE = `ibimina-static-${VERSION}`;
const NEXT_CACHE = `ibimina-next-${VERSION}`;
const RUNTIME_CACHE = `ibimina-runtime-${VERSION}`;
const AUTH_CACHE = `ibimina-auth-${VERSION}`;
const OFFLINE_URL = "/offline";
const BG_SYNC_TAG = "ibimina-offline-sync";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, NEXT_CACHE, RUNTIME_CACHE, AUTH_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached ?? fetchPromise;
};

const networkFirst = async (event) => {
  try {
    const response = await fetch(event.request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(event.request);
    if (cached) {
      return cached;
    }
    const offline = await caches.match(OFFLINE_URL);
    return offline ?? Response.error();
  }
};

const textEncoder = new TextEncoder();

const hashString = async (value) => {
  const buffer = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const getAuthScopedCacheKey = async (request) => {
  const authorizationHeader = request.headers.get("Authorization");
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)sb-access-token=([^;]+)/) ??
    cookieHeader.match(/(?:^|;\s*)sb-refresh-token=([^;]+)/);

  const credential = authorizationHeader ?? cookieMatch?.[1] ?? "guest";
  const hash = await hashString(credential);

  return `${request.url}::${hash}`;
};

const networkWithJsonCache = async (request) => {
  const cache = await caches.open(AUTH_CACHE);
  const cacheKey = await getAuthScopedCacheKey(request);
  try {
    const response = await fetch(request.clone());
    if (response && response.ok) {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};

const broadcastMessage = async (data) => {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  await Promise.all(clients.map((client) => client.postMessage(data)));
};

const registerBackgroundSync = async () => {
  if (!self.registration.sync) {
    return false;
  }
  try {
    await self.registration.sync.register(BG_SYNC_TAG);
    return true;
  } catch (error) {
    console.warn("service-worker.sync.register_failed", error);
    return false;
  }
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/_next/image")) {
    event.respondWith(staleWhileRevalidate(request, NEXT_CACHE));
    return;
  }

  if (url.pathname.startsWith("/api")) {
    if (request.method === "GET" && request.headers.get("accept")?.includes("application/json")) {
      event.respondWith(networkWithJsonCache(request));
    }
    return;
  }

  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(event));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

self.addEventListener("message", (event) => {
  const { data } = event;
  if (!data) {
    return;
  }

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "OFFLINE_QUEUE_REGISTER") {
    event.waitUntil(
      registerBackgroundSync().then((registered) => {
        if (!registered) {
          return broadcastMessage({ type: "OFFLINE_QUEUE_PROCESS", reason: "fallback" });
        }
        return undefined;
      }),
    );
    return;
  }

  if (data.type === "OFFLINE_QUEUE_UPDATED") {
    event.waitUntil(registerBackgroundSync());
    return;
  }

  if (data.type === "OFFLINE_QUEUE_PROCESS") {
    event.waitUntil(broadcastMessage({ type: "OFFLINE_QUEUE_PROCESS", reason: data.reason ?? "manual" }));
    return;
  }

  if (data.type === "AUTH_CACHE_RESET") {
    event.waitUntil(
      caches.open(AUTH_CACHE).then((cache) =>
        cache.keys().then((requests) => Promise.all(requests.map((request) => cache.delete(request)))),
      ),
    );
    return;
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === BG_SYNC_TAG) {
    event.waitUntil(broadcastMessage({ type: "OFFLINE_QUEUE_PROCESS", reason: "background-sync" }));
  }
});
