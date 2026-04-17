'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { pushOutbox, pullSync } from '@/infrastructure/storage/SyncService';

type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('online');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const syncInProgress = useRef(false);

  const updateOnlineStatus = useCallback(() => {
    if (!navigator.onLine) {
      setStatus('offline');
    } else if (status === 'offline') {
      setStatus('online');
    }
  }, [status]);

  const sync = useCallback(async () => {
    if (syncInProgress.current || !navigator.onLine) return;
    syncInProgress.current = true;
    setStatus('syncing');
    try {
      const { pushed } = await pushOutbox();
      await pullSync();
      setLastSync(new Date());
      setPendingCount(prev => Math.max(0, prev - pushed));
      setStatus('online');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus(navigator.onLine ? 'online' : 'offline'), 3000);
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [updateOnlineStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) sync();
    }, 30000);
    return () => clearInterval(interval);
  }, [sync]);

  return { status, lastSync, pendingCount, sync };
}
