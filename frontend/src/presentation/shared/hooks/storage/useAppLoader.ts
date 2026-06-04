'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useAppLoaderStore,
  getPhaseLabel,
  type LoadPhase,
  type AppAvailability,
} from '@/core/loading/appLoaderStore';
import { useSWPrecacheProgress } from './useSWPrecacheProgress';
import {
  initPersistence,
  cacheStoreData,
  getCachedCount,
} from '@/infrastructure/storage/db';
import { apiClient } from '@/infrastructure/api/client';
import { getStorageUsage } from './useCacheProgress';
import { setIdbReady } from '@/infrastructure/logging/appLogger';

let bootInProgress = false;

function extractItems(raw: unknown, store: string): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown>;
  if (r?.content && Array.isArray(r.content)) return r.content as Record<string, unknown>[];
  if (r?.data && Array.isArray(r.data)) return r.data as Record<string, unknown>[];
  const embedded = r._embedded as Record<string, unknown> | undefined;
  if (embedded?.[store] && Array.isArray(embedded[store])) return embedded[store] as Record<string, unknown>[];
  return [];
}

async function fetchPaginated(
  endpoint: string,
  store: string,
  pageSize: number,
  onProgress?: (page: number, total: number) => void,
): Promise<void> {
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    const res = await apiClient.get<{ content?: Record<string, unknown>[]; totalPages?: number }>(
      `${endpoint}?page=${page}&size=${pageSize}`,
    );
    const data = res.data as { content?: Record<string, unknown>[]; totalPages?: number };
    const items = (data.content ?? []).map((item) => ({ ...item, cachedAt: Date.now() }));
    if (items.length > 0) {
      await cacheStoreData(store, items);
    }
    hasMore = page + 1 < (data.totalPages ?? 0);
    page++;
    onProgress?.(page, data.totalPages ?? 0);
  }
}

async function fetchAll(endpoint: string, store: string): Promise<void> {
  const res = await apiClient.get<Record<string, unknown>[] | Record<string, unknown>>(endpoint);
  const items = extractItems(res.data, store).map(
    (item: Record<string, unknown>) => ({ ...item, cachedAt: Date.now() }),
  );
  if (items.length > 0) {
    await cacheStoreData(store, items);
  }
}

export function useAppLoader() {
  const store = useAppLoaderStore();
  const setPhase = useAppLoaderStore((s) => s.setPhase);
  const setAvailability = useAppLoaderStore((s) => s.setAvailability);
  const setError = useAppLoaderStore((s) => s.setError);
  const setSubStep = useAppLoaderStore((s) => s.setSubStep);
  const setSubProgress = useAppLoaderStore((s) => s.setSubProgress);
  const { done: swDone, triggerStart: swTriggerStart } = useSWPrecacheProgress();
  const swStartedRef = useRef(false);

  useEffect(() => {
    if (store.phase !== 'quota') return;
    (async () => {
      try {
        const usage = await getStorageUsage();
        if (usage.isCritical) {
          setError('Almacenamiento casi lleno. Libere espacio antes de continuar.');
          return;
        }
        setPhase('sw_precache');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al verificar almacenamiento');
      }
    })();
  }, [store.phase, setPhase, setError]);

  useEffect(() => {
    if (store.phase !== 'sw_precache') return;
    if (!swStartedRef.current) {
      swTriggerStart();
      swStartedRef.current = true;
    }
    if (swDone) {
      setPhase('db_open');
    }
  }, [store.phase, swDone, swTriggerStart, setPhase]);

  useEffect(() => {
    if (store.phase !== 'db_open') return;
    (async () => {
      try {
        await initPersistence();
        setIdbReady(true);
        setPhase('rehydrate_local');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al abrir base de datos');
      }
    })();
  }, [store.phase, setPhase, setError]);

  useEffect(() => {
    if (store.phase !== 'rehydrate_local') return;
    (async () => {
      try {
        const db = await import('idb').then((idb) => idb.openDB('inventory-offline', 5));
        const [warehouseCount, productCount, stockCount] = await Promise.all([
          db.count('warehouses'),
          db.count('products'),
          db.count('stockBalances'),
        ]);
        const hasMinCache = warehouseCount > 0 && productCount > 0 && stockCount > 0;

        if (hasMinCache) {
          setSubStep('Cargando datos locales...');
          setAvailability('ready_partial');
        } else {
          setSubStep(`${productCount > 0 ? 'Actualizando' : 'Descargando'} productos...`);
          setPhase('warehouses');
        }
      } catch (err) {
        import('@/infrastructure/logging/appLogger').then(m =>
          m.appLogger.error('[AppLoader] rehydrate_local falló, forzando descarga completa', err),
        );
        setPhase('warehouses');
      }
    })();
  }, [store.phase, setPhase, setAvailability, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'warehouses') return;
    (async () => {
      try {
        setSubStep('Descargando bodegas...');
        const count = await getCachedCount('warehouses');
        if (count === 0) await fetchAll('/api/v1/warehouses', 'warehouses');
        setPhase('products');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al descargar bodegas');
      }
    })();
  }, [store.phase, setPhase, setSubStep, setError]);

  useEffect(() => {
    if (store.phase !== 'products') return;
    (async () => {
      try {
        const count = await getCachedCount('products');
        if (count > 0) { setPhase('categories'); return; }
        await fetchPaginated('/api/v1/products/paginated', 'products', 100,
          (page, total) => {
            setSubStep(`página ${page}/${total}`);
            setSubProgress(page, total);
          },
        );
        setPhase('categories');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al descargar productos');
      }
    })();
  }, [store.phase, setPhase, setSubStep, setSubProgress, setError]);

  useEffect(() => {
    if (store.phase !== 'categories') return;
    (async () => {
      try {
        setSubStep('Descargando categorías...');
        const count = await getCachedCount('categories');
        if (count === 0) await fetchAll('/api/v1/categories', 'categories');
        setPhase('currencies');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al descargar categorías');
      }
    })();
  }, [store.phase, setPhase, setSubStep, setError]);

  useEffect(() => {
    if (store.phase !== 'currencies') return;
    (async () => {
      try {
        setSubStep('Descargando monedas...');
        const count = await getCachedCount('currencies');
        if (count === 0) await fetchAll('/api/v1/currencies', 'currencies');
        setPhase('exchange_rates');
      } catch (err) {
        import('@/infrastructure/logging/appLogger').then(m =>
          m.appLogger.warn('[AppLoader] currencies non-fatal', err),
        );
        setPhase('exchange_rates');
      }
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'exchange_rates') return;
    (async () => {
      try {
        setSubStep('Descargando tasas de cambio...');
        const count = await getCachedCount('exchangeRates');
        if (count === 0) await fetchAll('/api/v1/exchange-rates', 'exchangeRates');
        setPhase('customer_debts');
      } catch (err) {
        import('@/infrastructure/logging/appLogger').then(m =>
          m.appLogger.warn('[AppLoader] exchange_rates non-fatal', err),
        );
        setPhase('customer_debts');
      }
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'customer_debts') return;
    (async () => {
      try {
        setSubStep('Descargando deudas...');
        const count = await getCachedCount('customerDebts');
        if (count === 0) await fetchAll('/api/v1/customer-debts', 'customerDebts');
        setPhase('stock');
      } catch (err) {
        import('@/infrastructure/logging/appLogger').then(m =>
          m.appLogger.warn('[AppLoader] customer_debts non-fatal', err),
        );
        setPhase('stock');
      }
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'stock') return;
    (async () => {
      try {
        setSubStep('Descargando existencias...');
        const count = await getCachedCount('stockBalances');
        if (count === 0) await fetchAll('/api/v1/stock', 'stockBalances');
        setAvailability('ready_partial');
        setPhase('customers');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al descargar existencias');
      }
    })();
  }, [store.phase, setPhase, setAvailability, setSubStep, setError]);

  useEffect(() => {
    if (store.phase !== 'customers') return;
    (async () => {
      try {
        setSubStep('Descargando clientes...');
        const count = await getCachedCount('customers');
        if (count === 0) await fetchAll('/api/v1/customers', 'customers');
        setPhase('suppliers');
      } catch (err) {
        import('@/infrastructure/logging/appLogger').then(m =>
          m.appLogger.warn('[AppLoader] customers non-fatal', err),
        );
        setPhase('suppliers');
      }
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'suppliers') return;
    (async () => {
      try {
        setSubStep('Descargando proveedores...');
        const count = await getCachedCount('suppliers');
        if (count === 0) await fetchAll('/api/v1/suppliers', 'suppliers');
        setPhase('precache_routes');
      } catch (err) {
        import('@/infrastructure/logging/appLogger').then(m =>
          m.appLogger.warn('[AppLoader] suppliers non-fatal', err),
        );
        setPhase('precache_routes');
      }
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'precache_routes') return;
    (async () => {
      try {
        setSubStep('Precargando rutas...');
        setAvailability('ready_complete');
      } catch (err) {
        import('@/infrastructure/logging/appLogger').then(m =>
          m.appLogger.warn('[AppLoader] precache_routes non-fatal', err),
        );
        setAvailability('ready_complete');
      }
    })();
  }, [store.phase, setPhase, setAvailability, setSubStep]);

  const startLoading = useCallback(() => {
    if (bootInProgress) return;
    bootInProgress = true;
    try {
      useAppLoaderStore.getState().start();
    } finally {
      bootInProgress = false;
    }
  }, []);

  return {
    ...store,
    startLoading,
    phaseLabel: getPhaseLabel(store.phase),
  };
}
