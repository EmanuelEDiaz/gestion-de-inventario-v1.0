'use client';

import { useState, useEffect, useRef } from 'react';
import { getDB, getCachedCount, cacheStoreData, isStale } from '@/infrastructure/storage/db';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { apiClient } from '@/infrastructure/api/client';

export interface StorageUsage {
  usageBytes: number;
  quotaBytes: number;
  percentUsed: number;
  isLow: boolean;
  isWarning: boolean;
  isCritical: boolean;
  isSupported: boolean;
  readyForOffline: boolean;
}

export interface CacheProgress {
  phase: 'loading' | 'ready' | 'error';
  progress: number;
  currentStep: string;
  storageUsage: StorageUsage;
  isAppReady: boolean;
  modules: CacheModule[];
  overallPercent: number;
  isComplete: boolean;
}

const FASE_A_LABELS = ['Aplicación', 'Autenticación', 'Bodegas', 'Categorías'] as const;
const FASE_B = [
  { label: 'Productos', store: 'products' as const },
  { label: 'Clientes', store: 'customers' as const },
  { label: 'Proveedores', store: 'suppliers' as const },
  { label: 'Stock', store: 'stockBalances' as const },
] as const;

const DEFAULT_USAGE: StorageUsage = {
  usageBytes: 0, quotaBytes: 0, percentUsed: 0,
  isLow: true, isWarning: false, isCritical: false,
  isSupported: false, readyForOffline: true,
};

export function hasValidToken(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now() + 300_000;
  } catch {
    return false;
  }
}

export async function getStorageUsage(): Promise<StorageUsage> {
  try {
    if (!navigator.storage?.estimate) return { ...DEFAULT_USAGE, isSupported: false };
    const est = await navigator.storage.estimate();
    const usageBytes = est.usage ?? 0;
    const quotaBytes = est.quota ?? 0;
    const percentUsed = quotaBytes > 0 ? usageBytes / quotaBytes : 0;
    return {
      usageBytes, quotaBytes, percentUsed,
      isLow: percentUsed < 0.3,
      isWarning: percentUsed >= 0.8,
      isCritical: percentUsed >= 0.95,
      isSupported: true,
      readyForOffline: percentUsed < 0.95,
    };
  } catch {
    return { ...DEFAULT_USAGE };
  }
}

async function fetchPaginated(endpoint: string, store: string, pageSize: number): Promise<void> {
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<any>(`${endpoint}?page=${page}&size=${pageSize}`);
    const data = res.data;
    const items = (data.content ?? []).map((item: Record<string, unknown>) => ({ ...item, cachedAt: Date.now() }));
    if (items.length > 0) {
      await cacheStoreData(store, items);
    }
    hasMore = page + 1 < (data.totalPages ?? 0);
    page++;
  }
}

async function fetchAll(endpoint: string, store: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await apiClient.get<any>(endpoint);
  const items = (Array.isArray(res.data) ? res.data : []).map(
    (item: Record<string, unknown>) => ({ ...item, cachedAt: Date.now() })
  );
  if (items.length > 0) {
    await cacheStoreData(store, items);
  }
}

export function useCacheProgress(): CacheProgress {
  const allStores = [...FASE_A_LABELS.map(l => ({ name: l, store: l === 'Aplicación' ? 'outbox' : l === 'Autenticación' ? 'syncMeta' : l.toLowerCase() })), ...FASE_B.map(m => ({ name: m.label, store: m.store as string }))];

  const buildModules = (phase: string, progress: number): CacheModule[] => {
    const loadedCount = Math.floor((progress / 100) * allStores.length);
    return allStores.map((s, i) => ({
      name: s.name, store: s.store,
      loaded: i < loadedCount || phase === 'ready',
      count: 0,
    }));
  };

  const [st, setSt] = useState<CacheProgress>({
    phase: 'loading',
    progress: 0,
    currentStep: 'Inicializando',
    storageUsage: DEFAULT_USAGE, isAppReady: false,
    modules: buildModules('loading', 0),
    overallPercent: 0, isComplete: false,
  });

  const phaseBRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const setVal = (upd: Partial<CacheProgress>) => {
    if (mountedRef.current) setSt(prev => ({ ...prev, ...upd }));
  };

  useEffect(() => {
    getNetworkMode();

    (async () => {
      for (let i = 0; i < FASE_A_LABELS.length; i++) {
        setVal({ currentStep: FASE_A_LABELS[i] });
        try {
          if (i === 0) await getDB();
          else if (i === 1) hasValidToken();
          else await getCachedCount(i === 2 ? 'warehouses' : 'categories');
        } catch {
          setVal({ phase: 'error' });
          return;
        }
        setVal({ progress: Math.round(((i + 1) / FASE_A_LABELS.length) * 60) });
      }

      const storageUsage = await getStorageUsage();
      setVal({ isAppReady: true, storageUsage, progress: 60 });

      if (phaseBRef.current) return;
      phaseBRef.current = true;

      // Fase B — background data fetch (no await)
      setVal({ currentStep: 'Productos' });
      try {
        const count = await getCachedCount('products');
        if (count === 0) await fetchPaginated('/api/v1/products', 'products', 200);
      } catch { /* background, ignore */ }
      setVal({ progress: 70 });

      setVal({ currentStep: 'Clientes' });
      try {
        const count = await getCachedCount('customers');
        if (count === 0) await fetchAll('/api/v1/customers', 'customers');
      } catch { /* background, ignore */ }
      setVal({ progress: 80 });

      setVal({ currentStep: 'Proveedores' });
      try {
        const count = await getCachedCount('suppliers');
        if (count === 0) await fetchAll('/api/v1/suppliers', 'suppliers');
      } catch { /* background, ignore */ }
      setVal({ progress: 90 });

      setVal({ currentStep: 'Stock' });
      try {
        const count = await getCachedCount('stockBalances');
        if (count === 0) await fetchAll('/api/v1/stock', 'stockBalances');
      } catch { /* background, ignore */ }
      setVal({ progress: 95 });

      const finalUsage = await getStorageUsage();
      setVal({ phase: 'ready', storageUsage: finalUsage, progress: 100 });
    })();
  }, []);

  const overallPercent = st.progress;
  const modules = buildModules(st.phase, st.progress);
  const isComplete = st.phase === 'ready';

  return { ...st, overallPercent, modules, isComplete };
}

export { isStale };

export interface CacheModule {
  name: string;
  store: string;
  loaded: boolean;
  count: number;
}
