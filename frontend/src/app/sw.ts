/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Map assets in public/maps/ (fonts, sprites, style JSON) are auto-precached
// by Serwist via __SW_MANIFEST since they're part of the build output.
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const CONCURRENCY = 3;

let currentUserId: string | null = null;

const serwist = new Serwist({
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
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

self.addEventListener("install", () => { /* skipWaiting controlado por la app */ });
self.addEventListener("activate", serwist.handleActivate);
self.addEventListener("fetch", serwist.handleFetch);

self.addEventListener("message", async (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "SET_USER_CONTEXT") {
    currentUserId = event.data.payload.userId;
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
