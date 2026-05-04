'use client';

import { useEffect } from 'react';

const APP_SERVICE_WORKER_PATH = '/sw.js';
const APP_CACHE_PREFIX = 'inventory-';

async function clearInventoryCaches() {
  if (!('caches' in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith(APP_CACHE_PREFIX))
      .map((cacheName) => caches.delete(cacheName))
  );
}

async function unregisterInventoryServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations
      .filter((registration) => {
        const scriptUrl =
          registration.active?.scriptURL ??
          registration.waiting?.scriptURL ??
          registration.installing?.scriptURL;

        if (!scriptUrl) {
          return false;
        }

        return new URL(scriptUrl).pathname === APP_SERVICE_WORKER_PATH;
      })
      .map((registration) => registration.unregister())
  );
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const syncServiceWorker = async () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          await unregisterInventoryServiceWorkers();
          await clearInventoryCaches();
          return;
        }

        await navigator.serviceWorker.register(APP_SERVICE_WORKER_PATH, {
          scope: '/',
        });
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    };

    void syncServiceWorker();
  }, []);

  return null;
}
