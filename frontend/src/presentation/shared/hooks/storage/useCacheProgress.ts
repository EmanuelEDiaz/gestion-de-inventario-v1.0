'use client';

import { useMemo } from 'react';
import { useAppLoaderStore, getPhaseProgress, type LoadPhase } from '@/core/loading/appLoaderStore';

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

const DEFAULT_USAGE: StorageUsage = {
  usageBytes: 0, quotaBytes: 0, percentUsed: 0,
  isLow: true, isWarning: false, isCritical: false,
  isSupported: false, readyForOffline: true,
};

const PHASE_LABELS: { phase: LoadPhase; name: string; store: string }[] = [
  { phase: 'db_open', name: 'Aplicación', store: 'outbox' },
  { phase: 'warehouses', name: 'Bodegas', store: 'warehouses' },
  { phase: 'categories', name: 'Categorías', store: 'categories' },
  { phase: 'products', name: 'Productos', store: 'products' },
  { phase: 'customers', name: 'Clientes', store: 'customers' },
  { phase: 'suppliers', name: 'Proveedores', store: 'suppliers' },
  { phase: 'stock', name: 'Stock', store: 'stockBalances' },
];

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

export function useCacheProgress(): CacheProgress {
  const phase = useAppLoaderStore((s) => s.phase);
  const progress = useAppLoaderStore((s) => s.progress);
  const step = useAppLoaderStore((s) => s.step);
  const availability = useAppLoaderStore((s) => s.availability);

  const isComplete: boolean = availability === 'ready_partial';

  const appPhase: CacheProgress['phase'] = phase === 'error' ? 'error'
    : isComplete ? 'ready'
    : 'loading';

  const effectiveProgress = Math.max(progress, getPhaseProgress(phase));

  const loadedPhases = useMemo(() => {
    const phaseOrder = PHASE_LABELS.map(p => p.phase);
    const currentIdx = phaseOrder.indexOf(phase);
    return PHASE_LABELS.map((p, i) => ({
      ...p,
      loaded: i < currentIdx || isComplete || phase === 'error',
      count: 0,
    }));
  }, [phase, isComplete]);

  return {
    phase: appPhase,
    progress: effectiveProgress,
    currentStep: step,
    storageUsage: DEFAULT_USAGE,
    isAppReady: availability === 'ready_partial',
    modules: loadedPhases,
    overallPercent: effectiveProgress,
    isComplete,
  };
}

export function isStale(cachedAt: number, maxAgeMs: number): boolean {
  return Date.now() - cachedAt > maxAgeMs;
}

export interface CacheModule {
  name: string;
  store: string;
  loaded: boolean;
  count: number;
}
