'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { z } from 'zod';
import {
  useAppLoaderStore,
  getPhaseLabel,
  type LoadPhase,
  type AppAvailability,
} from '@/core/loading/appLoaderStore';
import {
  customerResponseSchema,
  supplierResponseSchema,
  stockResponseSchema,
  currencyResponseSchema,
  exchangeRateResponseSchema,
  customerDebtResponseSchema,
  warehouseResponseSchema,
  categoryResponseSchema,
  productResponseSchema,
} from '@/core/loading/validators';
import { getCachedCount, getDB } from '@/infrastructure/storage/db';
import { DownloadQueueService } from '@/infrastructure/storage/DownloadQueueService';
import { appLogger } from '@/infrastructure/logging/appLogger';
import { getStorageUsage } from './useCacheProgress';
import { startBackgroundTasks } from './useBackgroundTasks';

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

const CORE_ENTITIES = new Set(['warehouses', 'products', 'stock']);

function isCoreEntity(entityType: string): boolean {
  return CORE_ENTITIES.has(entityType);
}

export function useAppLoader() {
  const store = useAppLoaderStore();
  const setPhase = useAppLoaderStore((s) => s.setPhase);
  const setAvailability = useAppLoaderStore((s) => s.setAvailability);
  const setError = useAppLoaderStore((s) => s.setError);
  const setLastFailedPhase = useAppLoaderStore((s) => s.setLastFailedPhase);
  const setSubStep = useAppLoaderStore((s) => s.setSubStep);
  const bgTasksTriggeredRef = useRef(false);

  const handlePhaseError = useCallback(
    async (entityType: string, err: unknown, phaseLabel: string): Promise<void> => {
      const errMsg = err instanceof Error ? err.message : `Error al descargar ${phaseLabel}`;
      const [wCount, pCount, sCount] = await Promise.all([
        getCachedCount('warehouses'),
        getCachedCount('products'),
        getCachedCount('stockBalances'),
      ]);
      const hasCore = wCount > 0 && pCount > 0 && sCount > 0;

      if (hasCore) {
        setAvailability('degraded');
        setLastFailedPhase({ entityType, phaseLabel, error: errMsg });
        appLogger.warn(`[AppLoader] ${entityType} non-fatal — usando datos anteriores`, err);
      } else if (!isCoreEntity(entityType)) {
        setAvailability('degraded');
        setLastFailedPhase({ entityType, phaseLabel, error: errMsg });
        appLogger.warn(`[AppLoader] ${entityType} non-fatal — recurso secundario`, err);
      } else {
        setLastFailedPhase({ entityType, phaseLabel, error: errMsg });
        setError(errMsg);
      }
    },
    [setAvailability, setLastFailedPhase, setError],
  );

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
  }, [store.phase, setPhase, setSubStep, setError, handlePhaseError]);

  useEffect(() => {
    if (store.phase !== 'sw_precache') return;
    setPhase('db_open');
  }, [store.phase, setPhase]);

  useEffect(() => {
    if (store.phase !== 'db_open') return;
    (async () => {
      try {
        const db = await getDB();
        if (!db) throw new Error('IDB no disponible');
      } catch {
        setError('Error al abrir almacenamiento local');
        return;
      }
      setPhase('rehydrate_local');
    })();
  }, [store.phase, setPhase, setError]);

  useEffect(() => {
    if (store.phase !== 'rehydrate_local') return;
    (async () => {
      try {
        const [wCount, pCount, sCount] = await Promise.all([
          getCachedCount('warehouses'),
          getCachedCount('products'),
          getCachedCount('stockBalances'),
        ]);
        if (wCount > 0 && pCount > 0 && sCount > 0) {
          setAvailability('ready_partial');
          void startBackgroundTasks();
          setPhase('idle');
          return;
        }
      } catch {}
      setPhase('warehouses');
    })();
  }, [store.phase, setPhase, setAvailability, setSubStep, setError]);

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
        setPhase('categories');
      } catch (err) {
        await handlePhaseError('warehouses', err, 'bodegas');
        setPhase('categories');
      }
    })();
  }, [store.phase, setPhase, setSubStep, handlePhaseError]);

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
        setPhase('products');
      } catch (err) {
        await handlePhaseError('categories', err, 'categorías');
        setPhase('products');
      }
    })();
  }, [store.phase, setPhase, setSubStep, handlePhaseError]);

  useEffect(() => {
    if (store.phase !== 'products') return;
    (async () => {
      try {
        setSubStep('Descargando productos...');
        await loadFlatCatalog({
          endpoint: '/api/v1/products/paginated',
          idbStoreName: 'products',
          schema: productResponseSchema,
          entityLabel: 'productos',
        });
        setPhase('currencies');
      } catch (err) {
        await handlePhaseError('products', err, 'productos');
        setPhase('currencies');
      }
    })();
  }, [store.phase, setPhase, setSubStep, handlePhaseError]);

  useEffect(() => {
    if (store.phase !== 'currencies') return;
    (async () => {
      try {
        setSubStep('Descargando monedas...');
        await loadFlatCatalog({
          endpoint: '/api/v1/currencies',
          idbStoreName: 'currencies',
          schema: currencyResponseSchema,
          entityLabel: 'monedas',
        });
        setPhase('exchange_rates');
      } catch (err) {
        await handlePhaseError('currencies', err, 'monedas');
        setPhase('exchange_rates');
      }
    })();
  }, [store.phase, setPhase, setSubStep, handlePhaseError]);

  useEffect(() => {
    if (store.phase !== 'exchange_rates') return;
    (async () => {
      try {
        setSubStep('Descargando tasas de cambio...');
        await loadFlatCatalog({
          endpoint: '/api/v1/exchange-rates',
          idbStoreName: 'exchangeRates',
          schema: exchangeRateResponseSchema,
          entityLabel: 'tasas de cambio',
        });
        setPhase('customer_debts');
      } catch (err) {
        await handlePhaseError('exchange_rates', err, 'tasas de cambio');
        setPhase('customer_debts');
      }
    })();
    }, [store.phase, setPhase, setSubStep, handlePhaseError]);

  useEffect(() => {
    if (store.phase !== 'customer_debts') return;
    (async () => {
      try {
        setSubStep('Descargando deudas...');
        await loadFlatCatalog({
          endpoint: '/api/v1/debts',
          idbStoreName: 'customerDebts',
          schema: customerDebtResponseSchema,
          entityLabel: 'deudas de clientes',
        });
        setPhase('stock');
      } catch (err) {
        await handlePhaseError('customer_debts', err, 'deudas de clientes');
        setPhase('stock');
      }
    })();
  }, [store.phase, setPhase, setSubStep, handlePhaseError]);

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
        const currentAvail = useAppLoaderStore.getState().availability;
        if (currentAvail !== 'degraded' && currentAvail !== 'error') {
          setAvailability('ready_partial');
        }
        if (!bgTasksTriggeredRef.current && store.phase === 'stock') {
          bgTasksTriggeredRef.current = true;
          void startBackgroundTasks();
        }
        setPhase('customers');
      } catch (err) {
        await handlePhaseError('stock', err, 'existencias');
      }
    })();
  }, [store.phase, setPhase, setAvailability, setSubStep, setError, handlePhaseError]);

  useEffect(() => {
    if (store.phase !== 'customers') return;
    (async () => {
      try {
        setSubStep('Descargando clientes...');
        await loadFlatCatalog({
          endpoint: '/api/v1/customers',
          idbStoreName: 'customers',
          schema: customerResponseSchema,
          entityLabel: 'clientes',
        });
        setPhase('suppliers');
      } catch (err) {
        await handlePhaseError('customers', err, 'clientes');
      }
    })();
  }, [store.phase, setPhase, setSubStep, handlePhaseError]);

  useEffect(() => {
    if (store.phase !== 'suppliers') return;
    (async () => {
      try {
        setSubStep('Descargando proveedores...');
        await loadFlatCatalog({
          endpoint: '/api/v1/suppliers',
          idbStoreName: 'suppliers',
          schema: supplierResponseSchema,
          entityLabel: 'proveedores',
        });
        setPhase('idle');
      } catch (err) {
        await handlePhaseError('suppliers', err, 'proveedores');
      }
    })();
  }, [store.phase, setPhase, setSubStep, handlePhaseError]);

  useEffect(() => {
    if (store.availability !== 'ready_partial') return;
    if (store.phase !== 'idle') return;
    if (bgTasksTriggeredRef.current) return;
    bgTasksTriggeredRef.current = true;
    void startBackgroundTasks();
  }, [store.availability, store.phase]);

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
