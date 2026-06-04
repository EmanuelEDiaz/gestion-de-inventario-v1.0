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
import { setIdbReady, appLogger } from '@/infrastructure/logging/appLogger';

const FETCH_TIMEOUT_MS = 5_000;
const PAGE_SIZE = 100;

let bootInProgress = false;

function extractItems(raw: unknown, store: string): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown>;
  if (r?.content && Array.isArray(r.content)) return r.content as Record<string, unknown>[];
  if (r?.data && Array.isArray(r.data)) return r.data as Record<string, unknown>[];
  const embedded = r._embedded as Record<string, unknown> | undefined;
  if (embedded) {
    for (const key of Object.keys(embedded)) {
      const v = embedded[key];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
    if (embedded[store] && Array.isArray(embedded[store])) {
      return embedded[store] as Record<string, unknown>[];
    }
    const singular = store.replace(/s$/, '');
    if (embedded[singular] && Array.isArray(embedded[singular])) {
      return embedded[singular] as Record<string, unknown>[];
    }
  }
  return [];
}

async function fetchPaginated(
  endpoint: string,
  store: string,
  onProgress?: (page: number, total: number) => void,
): Promise<void> {
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await apiClient.get<{ content?: Record<string, unknown>[]; totalPages?: number }>(
        `${endpoint}?page=${page}&size=${PAGE_SIZE}`,
        { signal: controller.signal },
      );
      const data = res.data as { content?: Record<string, unknown>[]; totalPages?: number };
      const items = (data.content ?? []).map((item) => ({ ...item, cachedAt: Date.now() }));
      if (items.length > 0) {
        await cacheStoreData(store, items);
      }
      hasMore = page + 1 < (data.totalPages ?? 0);
      page++;
      onProgress?.(page, data.totalPages ?? 0);
    } finally {
      clearTimeout(timer);
    }
  }
}

async function fetchAll(endpoint: string, store: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await apiClient.get<Record<string, unknown>[] | Record<string, unknown>>(
      endpoint,
      { signal: controller.signal },
    );
    const items = extractItems(res.data, store).map(
      (item: Record<string, unknown>) => ({ ...item, cachedAt: Date.now() }),
    );
    if (items.length > 0) {
      await cacheStoreData(store, items);
    }
  } finally {
    clearTimeout(timer);
  }
}

async function loadCatalogOptional(endpoint: string, store: string, label: string): Promise<void> {
  try {
    const count = await getCachedCount(store);
    if (count > 0) return;
    await fetchAll(endpoint, store);
  } catch (err) {
    appLogger.warn(`[AppLoader] ${label} non-fatal`, err);
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
        appLogger.error('[AppLoader] rehydrate_local falló, forzando descarga completa', err);
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
        await fetchPaginated('/api/v1/products/paginated', 'products',
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
      setSubStep('Descargando monedas...');
      await loadCatalogOptional('/api/v1/currencies', 'currencies', 'currencies');
      setPhase('exchange_rates');
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'exchange_rates') return;
    (async () => {
      setSubStep('Descargando tasas de cambio...');
      await loadCatalogOptional('/api/v1/exchange-rates', 'exchangeRates', 'exchange_rates');
      setPhase('customer_debts');
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'customer_debts') return;
    (async () => {
      setSubStep('Descargando deudas...');
      await loadCatalogOptional('/api/v1/customer-debts', 'customerDebts', 'customer_debts');
      setPhase('stock');
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
      setSubStep('Descargando clientes...');
      await loadCatalogOptional('/api/v1/customers', 'customers', 'customers');
      setPhase('suppliers');
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'suppliers') return;
    (async () => {
      setSubStep('Descargando proveedores...');
      await loadCatalogOptional('/api/v1/suppliers', 'suppliers', 'suppliers');
      setPhase('idle');
    })();
  }, [store.phase, setPhase, setSubStep]);

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

export type { LoadPhase, AppAvailability };
