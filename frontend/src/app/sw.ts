/// <reference lib="esnext" />
/// <reference lib="webworker" />
import {
  CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, StaleWhileRevalidate,
} from "serwist";
import type { PrecacheEntry, RouteMatchCallbackOptions, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const CONCURRENCY = 3;
let currentUserId: string | null = null;

const CACHE_VERSION = "R1";
const CACHE = (name: string): string => `cache-${CACHE_VERSION}-${name}`;
const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;
const THIRTY_DAYS = 30 * ONE_DAY;

const runtimeCaching: RuntimeCaching[] = [
  { matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i, handler: new CacheFirst({ cacheName: CACHE("gf-webfonts"), plugins: [new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 365 * ONE_DAY })] }) },
  { matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i, handler: new StaleWhileRevalidate({ cacheName: CACHE("gf-stylesheets"), plugins: [new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: ONE_WEEK })] }) },
  { matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i, handler: new CacheFirst({ cacheName: CACHE("fonts"), plugins: [new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: THIRTY_DAYS })] }) },
  { matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i, handler: new StaleWhileRevalidate({ cacheName: CACHE("images"), plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: THIRTY_DAYS })] }) },
  { matcher: /\/_next\/static.+\.js$/i, handler: new CacheFirst({ cacheName: CACHE("next-js"), plugins: [new ExpirationPlugin({ maxEntries: 256, maxAgeSeconds: ONE_DAY })] }) },
  { matcher: /\/_next\/static.+\.css$/i, handler: new CacheFirst({ cacheName: CACHE("next-css"), plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: ONE_DAY })] }) },
  { matcher: /\.(?:js)$/i, handler: new StaleWhileRevalidate({ cacheName: CACHE("js"), plugins: [new ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: ONE_DAY })] }) },
  { matcher: /\.(?:css|less)$/i, handler: new StaleWhileRevalidate({ cacheName: CACHE("css"), plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },
  { matcher: /\.(?:mp3|wav|ogg)$/i, handler: new CacheFirst({ cacheName: CACHE("audio"), plugins: [new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: ONE_DAY })] }) },
  { matcher: /\/_next\/data\/.+\/.+\.json$/i, handler: new NetworkFirst({ cacheName: CACHE("next-data"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },
  { matcher: /\.(?:json|xml|csv)$/i, handler: new NetworkFirst({ cacheName: CACHE("data"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },
  { matcher: /\/api\/auth\/.*/, handler: new NetworkOnly({ networkTimeoutSeconds: 10 }) },
  { matcher: ({ sameOrigin, url: { pathname } }: RouteMatchCallbackOptions) => sameOrigin && (pathname.startsWith("/api/v1/images") || pathname.startsWith("/media/")), handler: new NetworkFirst({ cacheName: CACHE("media-images"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 256, maxAgeSeconds: ONE_WEEK })] }) },
  { matcher: ({ sameOrigin, url: { pathname } }: RouteMatchCallbackOptions) => sameOrigin && pathname.startsWith("/api/"), handler: new NetworkOnly() },
  { matcher: ({ request, url: { pathname }, sameOrigin }: RouteMatchCallbackOptions) => request.headers.get("RSC") === "1" && request.headers.get("Next-Router-Prefetch") === "1" && sameOrigin && !pathname.startsWith("/api/"), handler: new NetworkFirst({ cacheName: CACHE("rsc-prefetch"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },
  { matcher: ({ request, url: { pathname }, sameOrigin }: RouteMatchCallbackOptions) => request.headers.get("RSC") === "1" && sameOrigin && !pathname.startsWith("/api/"), handler: new NetworkFirst({ cacheName: CACHE("rsc"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },
  { matcher: ({ request, url: { pathname }, sameOrigin }: RouteMatchCallbackOptions) => request.mode === "navigate" && sameOrigin && !pathname.startsWith("/api/"), handler: new NetworkFirst({ cacheName: CACHE("pages"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },
  { matcher: ({ url: { pathname } }: RouteMatchCallbackOptions) => pathname === "/~offline", handler: new CacheFirst({ cacheName: CACHE("offline") }) },
  { matcher: ({ url: { pathname }, sameOrigin }: RouteMatchCallbackOptions) => sameOrigin && !pathname.startsWith("/api/"), handler: new NetworkFirst({ cacheName: CACHE("others"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },
];

const serwist = new Serwist({
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

const CACHE_VERSION_PREFIX = "cache-R1-";

async function deleteOldCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => !name.startsWith(CACHE_VERSION_PREFIX) && !name.startsWith("serwist:"))
      .map((name) => caches.delete(name)),
  );
}

self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    deleteOldCaches(),
    self.clients.claim(),
  ]));
  serwist.handleActivate(event);
});
self.addEventListener("fetch", serwist.handleFetch);

async function clearUserCaches(userId: string): Promise<void> {
  const cacheNames = await caches.keys();
  const userPrefix = `inventory-offline-${userId}`;
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith(userPrefix))
      .map((name) => caches.delete(name)),
  );
}

self.addEventListener("message", async (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "SET_USER_CONTEXT") {
    const prevUserId = currentUserId;
    currentUserId = event.data.payload.userId;
    if (currentUserId && currentUserId !== prevUserId) {
      await clearUserCaches(currentUserId);
    }
    return;
  }

  if (event.data?.type === "START_PRECACHING") {
    const manifest = self.__SW_MANIFEST;
    if (!manifest || manifest.length === 0) {
      const client = await self.clients.get((event.source as WindowClient | undefined)?.id ?? "");
      client?.postMessage({ type: "PRECACHE_PROGRESS", completed: 0, total: 0 });
      return;
    }

    const total = manifest.length;
    let completed = 0;

    const postProgress = () => {
      self.clients.matchAll({ type: "window" }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "PRECACHE_PROGRESS", completed, total });
        }
      });
    };

    for (let i = 0; i < manifest.length; i += CONCURRENCY) {
      const batch = manifest.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(async (entry) => {
          try {
            const url = typeof entry === "string" ? entry : entry.url;
            const request = new Request(url, { credentials: "same-origin" });
            const response = await fetch(request);
            if (response.ok) {
              const cache = await caches.open("serwist:precache");
              await cache.put(request, response);
            }
          } catch {
            // individual fetch failure is non-fatal
          }
        })
      );
      completed += batch.length;
      postProgress();
    }
  }
});
