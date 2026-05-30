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
      await queryClient.invalidateQueries();
      setLastSyncAt(Date.now());
      setStatus('online');
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      console.error('sync failed', err);
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
    const interval = setInterval(sync, 30000);
    return () => clearInterval(interval);
  }, [mode, sync]);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const count = await getOutboxCount();
        setPendingCount(count);
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(poll);
  }, []);

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
