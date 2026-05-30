'use client';

import { useState, useEffect, useRef } from 'react';
import { getDB, getCachedCount, isStale } from '@/infrastructure/storage/db';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';

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
  isLow: false, isWarning: false, isCritical: false,
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
    const percentUsed = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0;
    return {
      usageBytes, quotaBytes, percentUsed,
      isLow: percentUsed > 50,
      isWarning: percentUsed > 70,
      isCritical: percentUsed > 90,
      isSupported: true,
      readyForOffline: percentUsed < 80,
    };
  } catch {
    return { ...DEFAULT_USAGE };
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

      for (let i = 0; i < FASE_B.length; i++) {
        setVal({ currentStep: FASE_B[i].label });
        try { await getCachedCount(FASE_B[i].store); } catch { /* background */ }
        setVal({ progress: Math.round(60 + ((i + 1) / FASE_B.length) * 40) });
      }

      const finalUsage = await getStorageUsage();
      setVal({ phase: 'ready', storageUsage: finalUsage, progress: 100 });
    })();
  }, []);

  const overallPercent = st.progress;
  const modules = buildModules(st.phase, st.progress);
  const isComplete = st.isAppReady;

  return { ...st, overallPercent, modules, isComplete };
}

export { isStale };

export interface CacheModule {
  name: string;
  store: string;
  loaded: boolean;
  count: number;
}
