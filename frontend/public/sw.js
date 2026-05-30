const CACHES = {
  static: 'inventory-static-v2',
  pages: 'inventory-pages-v1',
  thumbs: 'inventory-thumbs-v1',
  tiles: 'map-tiles-v1',
};

const THUMB_MAX_ENTRIES = 100;
const OFFLINE_PAGE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHES.static));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const current = Object.values(CACHES);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('inventory-') && !current.includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    if (url.pathname.startsWith('/api/v1/')) {
      event.respondWith(
        fetch(request).catch(() => {
          self.registration.sync.register('sync-outbox').catch(() => {});
          return new Response(null, { status: 503, statusText: 'Service Unavailable' });
        })
      );
    }
    return;
  }

  if (url.pathname.includes('thumb256')) {
    event.respondWith(thumbCacheFirst(event));
    return;
  }

  if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstPage(event));
    return;
  }

  if (url.pathname.startsWith('/tiles/') || url.pathname.startsWith('/geo/')) {
    event.respondWith(tilesCacheFirst(event));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  if (['font', 'script', 'style'].includes(request.destination) && url.origin === self.location.origin) {
    event.respondWith(staticCacheFirst(event));
  }
});

async function tilesCacheFirst(event) {
  const { request } = event;
  const cached = await caches.match(request, { cacheName: CACHES.tiles });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      event.waitUntil(
        caches.open(CACHES.tiles).then((c) => c.put(request, response.clone()))
      );
    }
    return response;
  } catch {
    return new Response(null, { status: 404 });
  }
}

async function thumbCacheFirst(event) {
  const { request } = event;
  const cached = await caches.match(request, { cacheName: CACHES.thumbs });
  if (cached) {
    event.waitUntil(touchLru(request.url));
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      event.waitUntil(putThumbWithLru(request.url, response.clone()));
    }
    return response;
  } catch {
    return new Response(null, { status: 404 });
  }
}

async function touchLru(url) {
  const cache = await caches.open(CACHES.thumbs);
  const meta = await cache.match('__lru__');
  if (!meta) return;
  const map = await meta.json();
  map[url] = Date.now();
  cache.put('__lru__', new Response(JSON.stringify(map)));
}

async function putThumbWithLru(url, response) {
  const cache = await caches.open(CACHES.thumbs);
  await cache.put(url, response);
  const meta = await cache.match('__lru__');
  let map = {};
  if (meta) map = await meta.json();
  const now = Date.now();
  map[url] = now;
  const entries = Object.entries(map).sort((a, b) => a[1] - b[1]);
  if (entries.length > THUMB_MAX_ENTRIES) {
    const toDelete = entries.slice(0, entries.length - THUMB_MAX_ENTRIES);
    for (const [delUrl] of toDelete) {
      cache.delete(delUrl);
      delete map[delUrl];
    }
  }
  cache.put('__lru__', new Response(JSON.stringify(map)));
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cached = await caches.match(request, { cacheName: CACHES.static });
  if (cached) {
    fetch(request)
      .then((response) => {
        if (response.ok) {
          event.waitUntil(
            caches.open(CACHES.static).then((c) => c.put(request, response))
          );
        }
      })
      .catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      event.waitUntil(
        caches.open(CACHES.static).then((c) => c.put(request, clone))
      );
    }
    return response;
  } catch {
    return new Response(null, { status: 404 });
  }
}

async function networkFirstPage(event) {
  const { request } = event;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      event.waitUntil(
        caches.open(CACHES.pages).then((c) => c.put(request, clone))
      );
    }
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName: CACHES.pages });
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_PAGE);
    if (offline) return offline;
    return new Response('Offline', { status: 503 });
  }
}

async function staticCacheFirst(event) {
  const { request } = event;
  const cached = await caches.match(request, { cacheName: CACHES.static });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      event.waitUntil(
        caches.open(CACHES.static).then((c) => c.put(request, response.clone()))
      );
    }
    return response;
  } catch {
    return new Response(null, { status: 404 });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-outbox') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'SYNC_OUTBOX' });
        }
      })
    );
  }
});
