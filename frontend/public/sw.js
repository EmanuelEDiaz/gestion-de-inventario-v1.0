const CACHE_PREFIX = 'inventory-';
const CACHE_NAME = 'inventory-static-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/apple-touch-icon.svg',
];
const IS_LOCALHOST =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1';

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function isCacheableAsset(request, url) {
  if (request.method !== 'GET') {
    return false;
  }

  if (url.origin !== self.location.origin) {
    return false;
  }

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return false;
  }

  return ['font', 'image', 'script', 'style'].includes(request.destination);
}

async function deleteInventoryCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
      .map((cacheName) => caches.delete(cacheName))
  );
}

if (IS_LOCALHOST) {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      (async () => {
        await deleteInventoryCaches();
        await self.registration.unregister();

        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });

        await Promise.all(
          clients.map((client) => {
            if ('navigate' in client) {
              return client.navigate(client.url);
            }

            return Promise.resolve(undefined);
          })
        );
      })()
    );
  });
} else {
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      (async () => {
        await deleteInventoryCaches();
        await self.clients.claim();
      })()
    );
  });

  self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (isNavigationRequest(event.request)) {
      event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
      );
      return;
    }

    if (!isCacheableAsset(event.request, url)) {
      return;
    }

    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            void caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        });
      })
    );
  });
}
