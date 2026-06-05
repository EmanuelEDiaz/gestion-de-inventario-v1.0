'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getCachedCount,
  getOutboxCount,
  checkStorageQuota,
  requestPersistentStorage,
  getSyncMeta,
} from '@/infrastructure/storage/db';
import { getMapMeta, type MapMetadata } from '@/infrastructure/maps/opfs-utils';
import { appLogger } from '@/infrastructure/logging/appLogger';

export interface QuotaInfo {
  usage: number;
  quota: number;
  percentUsed: number;
  persistent: boolean;
}

export interface HealthData {
  quota: QuotaInfo | null;
  storeCounts: Record<string, number>;
  totalEntries: number;
  outboxCount: number;
  mapMeta: MapMetadata | null;
  lastBootAudit: { at: number; critical: number; diagnostic: number } | null;
  loading: boolean;
  error: string | null;
}

const TRACKED_STORES: ReadonlyArray<string> = [
  'products',
  'categories',
  'warehouses',
  'stockBalances',
  'customers',
  'suppliers',
  'currencies',
  'exchangeRates',
  'customerDebts',
  'outbox',
  'corruptionQueue',
  'downloadChunks',
  'appLogs',
  'deadLetter',
];

async function loadQuota(): Promise<QuotaInfo | null> {
  const [estimate, persistent] = await Promise.all([
    checkStorageQuota(),
    requestPersistentStorage().catch(() => false),
  ]);
  if (!estimate) return null;
  return { ...estimate, persistent };
}

async function loadStoreCounts(): Promise<Record<string, number>> {
  const entries = await Promise.all(
    TRACKED_STORES.map(async (store) => [store, await getCachedCount(store)] as const),
  );
  return Object.fromEntries(entries);
}

async function loadBootAudit(): Promise<HealthData['lastBootAudit']> {
  try {
    const raw = await getSyncMeta('boot_audit');
    if (!raw || typeof raw !== 'object') return null;
    const candidate = raw as Record<string, unknown>;
    if (typeof candidate.at !== 'number') return null;
    return {
      at: candidate.at,
      critical: typeof candidate.critical === 'number' ? candidate.critical : 0,
      diagnostic: typeof candidate.diagnostic === 'number' ? candidate.diagnostic : 0,
    };
  } catch {
    return null;
  }
}

export function useHealthData(refreshKey: number): HealthData {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [storeCounts, setStoreCounts] = useState<Record<string, number>>({});
  const [outboxCount, setOutboxCount] = useState(0);
  const [mapMeta, setMapMeta] = useState<MapMetadata | null>(null);
  const [lastBootAudit, setLastBootAudit] = useState<HealthData['lastBootAudit']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [q, counts, outbox, map, audit] = await Promise.all([
        loadQuota(),
        loadStoreCounts(),
        getOutboxCount(),
        getMapMeta().catch((err: unknown) => {
          appLogger.warn('[HealthPanel] getMapMeta failed', err);
          return null;
        }),
        loadBootAudit(),
      ]);
      setQuota(q);
      setStoreCounts(counts);
      setOutboxCount(outbox);
      setMapMeta(map);
      setLastBootAudit(audit);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      appLogger.error('[HealthPanel] data load failed', err, {
        errorCode: 'ERR_HEALTHPANEL_LOAD',
      });
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  const totalEntries = Object.values(storeCounts).reduce((acc, n) => acc + n, 0);

  return { quota, storeCounts, totalEntries, outboxCount, mapMeta, lastBootAudit, loading, error };
}
