'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pushOutbox, pullCatalogsIfStale, pullDeltaSync } from '@/infrastructure/storage/SyncService';
import { checkStorageQuota } from '@/infrastructure/storage/db';
import { getOutboxCount } from '@/infrastructure/storage/outbox';
import { useNetworkStore } from '@/infrastructure/storage/networkStore';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { tryRefreshTokenOnReconnect } from '@/infrastructure/storage/authStore';
import { useNetworkHealth } from './useNetworkHealth';

const SYNC_INTERVAL = 120_000;
const OUTBOX_POLL_INTERVAL = 30_000;

const QUERY_PREFIXES = [
  'products',
  'categories',
  'customers',
  'suppliers',
  'warehouses',
  'stockBalances',
  'sales',
  'purchases',
  'transfers',
  'movements',
  'adjustments',
  'returns',
  'customerDebts',
  'notifications',
  'currencies',
  'exchangeRates',
];

export interface SyncStatus {
  status: 'online' | 'offline' | 'syncing' | 'error';
  pendingCount: number;
  lastSyncAt: number | null;
  sync: () => Promise<void>;
  isOffline: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  error: string | null;
}

function invalidateSpecificQueries(queryClient: ReturnType<typeof useQueryClient>) {
  for (const prefix of QUERY_PREFIXES) {
    queryClient.invalidateQueries({ queryKey: [prefix] });
  }
}

function scheduleIdle(callback: () => void, timeout = 2000): number {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(callback, { timeout }) as unknown as number;
  }
  return setTimeout(callback, timeout) as unknown as number;
}

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<'online' | 'offline' | 'syncing' | 'error'>('online');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const mode = useNetworkStore(s => s.mode);

  const sync = useCallback(async () => {
    const currentMode = getNetworkMode();
    if (currentMode === 'offline') {
      setStatus('offline');
      return;
    }

    setStatus('syncing');
    setError(null);
    try {
      await tryRefreshTokenOnReconnect();
      await pushOutbox();
      await checkStorageQuota();
      await pullCatalogsIfStale();
      await pullDeltaSync();
      invalidateSpecificQueries(queryClient);
      setLastSyncAt(Date.now());
      setStatus('online');
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      import('@/infrastructure/logging/appLogger').then(m => m.appLogger.error('sync failed', err));
    }
  }, [queryClient]);

  useNetworkHealth(() => { sync(); });

  useEffect(() => {
    setStatus(mode === 'offline' ? 'offline' : 'online');
    if (mode !== 'offline') {
      sync();
    }
  }, [mode, sync]);

  useEffect(() => {
    if (mode === 'offline') return;
    const interval = setInterval(() => {
      scheduleIdle(sync);
    }, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [mode, sync]);

  useEffect(() => {
    if (mode === 'offline') return;
    const poll = setInterval(async () => {
      try {
        const count = await getOutboxCount();
        setPendingCount(count);
      } catch {
        // ignore
      }
    }, OUTBOX_POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [mode]);

  return {
    status,
    pendingCount,
    lastSyncAt,
    sync,
    isOffline: mode === 'offline',
    isOnline: mode !== 'offline',
    isSyncing: status === 'syncing',
    error,
  };
}
