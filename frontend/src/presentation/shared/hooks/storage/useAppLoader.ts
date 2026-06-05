'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { z } from 'zod';
import {
  useAppLoaderStore,
  getPhaseLabel,
  type LoadPhase,
  type AppAvailability,
} from '@/core/loading/appLoaderStore';
import { useSWPrecacheProgress } from './useSWPrecacheProgress';
import {
  initPersistence,
  getCachedCount,
  DB_VERSION,
} from '@/infrastructure/storage/db';
import { DownloadQueueService } from '@/infrastructure/storage/DownloadQueueService';
import {
  productResponseSchema,
  customerResponseSchema,
  supplierResponseSchema,
  warehouseResponseSchema,
  categoryResponseSchema,
  stockResponseSchema,
  currencyResponseSchema,
  exchangeRateResponseSchema,
  customerDebtResponseSchema,
} from '@/core/loading/validators';
import { getStorageUsage } from './useCacheProgress';
import { setIdbReady, appLogger } from '@/infrastructure/logging/appLogger';

const PAGE_SIZE = 100;

let bootInProgress = false;

const LOADER_USER_ID = 'boot-loader';

async function loadFlatCatalog(params: {
  endpoint: string;
  idbStoreName: string;
  schema: z.ZodSchema<unknown>;
  entityLabel: string;
}): Promise<void> {
  const count = await getCachedCount(params.idbStoreName);
  if (count > 0) return;
  const result = await DownloadQueueService.fetchAllWithIntegrity(
    params.endpoint,
    params.idbStoreName,
    params.schema,
    { userId: LOADER_USER_ID },
  );
  if (!result.ok) {
    appLogger.warn(
      `[AppLoader] ${params.entityLabel} falló (parcial o total)`,
      result.errors,
    );
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
        const db = await import('idb').then((idb) => idb.openDB('inventory-offline', DB_VERSION));
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
        await loadFlatCatalog({
          endpoint: '/api/v1/warehouses',
          idbStoreName: 'warehouses',
          schema: warehouseResponseSchema,
          entityLabel: 'bodegas',
        });
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
        const result = await DownloadQueueService.downloadEntity({
          entityType: 'products',
          endpoint: '/api/v1/products',
          idbStoreName: 'products',
          schema: productResponseSchema,
          pageSize: PAGE_SIZE,
          userId: LOADER_USER_ID,
          onProgress: (page, total) => {
            setSubStep(`Página ${page}/${total}`);
            setSubProgress(page, total);
          },
        });
        if (!result.ok && result.chunksFailed > 0) {
          appLogger.warn('[AppLoader] products descarga parcial', result.errors);
        }
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
        await loadFlatCatalog({
          endpoint: '/api/v1/categories',
          idbStoreName: 'categories',
          schema: categoryResponseSchema,
          entityLabel: 'categorías',
        });
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
      await loadFlatCatalog({
        endpoint: '/api/v1/currencies',
        idbStoreName: 'currencies',
        schema: currencyResponseSchema,
        entityLabel: 'monedas',
      });
      setPhase('exchange_rates');
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'exchange_rates') return;
    (async () => {
      setSubStep('Descargando tasas de cambio...');
      await loadFlatCatalog({
        endpoint: '/api/v1/exchange-rates',
        idbStoreName: 'exchangeRates',
        schema: exchangeRateResponseSchema,
        entityLabel: 'tasas de cambio',
      });
      setPhase('customer_debts');
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'customer_debts') return;
    (async () => {
      setSubStep('Descargando deudas...');
      await loadFlatCatalog({
        endpoint: '/api/v1/debts',
        idbStoreName: 'customerDebts',
        schema: customerDebtResponseSchema,
        entityLabel: 'deudas de clientes',
      });
      setPhase('stock');
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'stock') return;
    (async () => {
      try {
        setSubStep('Descargando existencias...');
        await loadFlatCatalog({
          endpoint: '/api/v1/stock',
          idbStoreName: 'stockBalances',
          schema: stockResponseSchema,
          entityLabel: 'existencias',
        });
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
      await loadFlatCatalog({
        endpoint: '/api/v1/customers',
        idbStoreName: 'customers',
        schema: customerResponseSchema,
        entityLabel: 'clientes',
      });
      setPhase('suppliers');
    })();
  }, [store.phase, setPhase, setSubStep]);

  useEffect(() => {
    if (store.phase !== 'suppliers') return;
    (async () => {
      setSubStep('Descargando proveedores...');
      await loadFlatCatalog({
        endpoint: '/api/v1/suppliers',
        idbStoreName: 'suppliers',
        schema: supplierResponseSchema,
        entityLabel: 'proveedores',
      });
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
