import { apiClient } from '@/infrastructure/api/client';
import axios from 'axios';
import { getDB, getSyncMeta, setSyncMeta, getStoreCursor, setStoreCursor, batchPut, type OutboxEntry } from './db';
import { getPendingOutbox, removeFromOutbox, markOutboxEntry, moveToDeadLetter, updateRetry } from './outbox';
import { getNetworkMode } from './networkStore';

export interface PushResult {
  pushed: number;
  failed: number;
  total: number;
  incidents: string[];
  conflicts: number;
}

export interface PullResult {
  store: string;
  pulled: number;
  updatedCursor: number;
}

export interface SyncLogEntry {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  afterData?: any;
  occurredAt: string;
}

export interface SyncPullResponse {
  nextCursor: number;
  hasMore: boolean;
  entries: SyncLogEntry[];
}

interface SyncPushOperation {
  operationId: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: unknown;
}

interface SyncPushResponseEntry {
  operationId: string;
  accepted: boolean;
  data?: unknown;
  error?: string;
  entityId?: string;
}

interface SyncPushResponse {
  results: SyncPushResponseEntry[];
}

interface TempIdMapping {
  tempId: string;
  realId: string;
  entityType: string;
}

const MAX_BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const CATALOG_TTL = 5 * 60 * 1000;
const CATALOG_STORES = ['products', 'categories', 'warehouses'] as const;
const DELTA_STORES = ['products', 'categories', 'customers', 'suppliers', 'stockBalances', 'warehouses'] as const;
const CONCURRENCY = 3;

function nextRetryDelay(retryCount: number): number {
  return Math.min(30_000 * Math.pow(4, retryCount), 2 * 60 * 60 * 1000);
}

function collapseOutboxEntries(entries: OutboxEntry[]): OutboxEntry[] {
  const groups = new Map<string, OutboxEntry[]>();
  for (const entry of entries) {
    const key = `${entry.entityType}:${entry.entityId}`;
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  const collapsed: OutboxEntry[] = [];
  for (const [, group] of groups) {
    if (group.length === 1) {
      collapsed.push(group[0]);
    } else {
      const merged = mergeOutboxGroup(group);
      collapsed.push(...merged);
    }
  }
  return collapsed;
}

function mergeOutboxGroup(group: OutboxEntry[]): OutboxEntry[] {
  group.sort((a, b) => a.createdAt - b.createdAt);
  const first = group[0];
  const last = group[group.length - 1];

  const actions = group.map(e => e.action);
  const hasCreate = actions.includes('CREATE');
  const hasDelete = actions.includes('DELETE');

  if (hasCreate && hasDelete && group.length === 2) {
    return [{ ...first, action: 'NOOP', skip: true }];
  }

  if (hasDelete) {
    return [last];
  }

  if (hasCreate && group.length > 1) {
    const update = { ...last, entityId: first.entityId, isTempId: true };
    return [first, update];
  }

  return [last];
}

async function updateTempIdMappings(mappings: TempIdMapping[]): Promise<void> {
  const db = await getDB();
  for (const m of mappings) {
    const storeName = m.entityType.toLowerCase();
    const tx = db.transaction(storeName as any, 'readwrite');
    const store = tx.objectStore(storeName as any) as any;
    const cached = await store.get(m.tempId);
    if (cached) {
      await store.delete(m.tempId);
      await store.put({ ...cached, id: m.realId });
    }
    await tx.done;
  }
}

export async function pushOutbox(): Promise<PushResult> {
  const result: PushResult = { pushed: 0, failed: 0, total: 0, incidents: [], conflicts: 0 };

  if (getNetworkMode() === 'offline') return result;

  let all = await getPendingOutbox() as any[];
  const now = Date.now();

  for (const entry of all) {
    if (entry.status === 'syncing') {
      await markOutboxEntry(entry.id!, 'pending');
    }
    if (entry.retryCount >= MAX_RETRIES) {
      await moveToDeadLetter(entry);
      result.failed++;
      result.incidents.push(`Outbox entry ${entry.id} exceeded max retries`);
    }
  }

  all = await getPendingOutbox() as any[];
  const collapsed = collapseOutboxEntries(all);
  const eligible = collapsed.filter((e: any) => !e.skip && (!e.nextRetryAt || e.nextRetryAt <= now));

  result.total = collapsed.length;

  for (let i = 0; i < eligible.length; i += MAX_BATCH_SIZE) {
    const batch = eligible.slice(i, i + MAX_BATCH_SIZE);

    try {
      for (const entry of batch) {
        await markOutboxEntry(entry.id!, 'syncing');
      }

      const body = { operations: batch.map((e: OutboxEntry) => ({
        operationId: e.operationId,
        entityType: e.entityType,
        entityId: e.entityId,
        action: e.action,
        payload: e.payload,
      })) };

      const response = await apiClient.post<SyncPushResponse>('/api/v1/sync/push', body);

      const mappings: TempIdMapping[] = [];
      for (const entry of response.data.results) {
        const match = batch.find((e: any) => e.operationId === entry.operationId);
        if (!match) continue;

        if (entry.accepted) {
          await removeFromOutbox(match.id!);
          result.pushed++;
          if (entry.entityId) {
            mappings.push({ tempId: match.entityId, realId: entry.entityId, entityType: match.entityType });
          }
        } else {
          await moveToDeadLetter(match);
          result.failed++;
          result.incidents.push(`Error on ${entry.operationId}: ${entry.error}`);
        }
      }

      if (mappings.length > 0) {
        await updateTempIdMappings(mappings);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404 || status === 409) {
          for (const entry of batch) {
            await moveToDeadLetter(entry);
            result.failed++;
            result.incidents.push(`${entry.operationId} failed with status ${status}`);
          }
        } else {
          for (const entry of batch) {
            const newRetryCount = (entry.retryCount ?? 0) + 1;
            const delay = nextRetryDelay(newRetryCount);
            await updateRetry(entry.id!, newRetryCount, now + delay);
            await markOutboxEntry(entry.id!, 'pending');
            result.failed++;
            result.incidents.push(`${entry.operationId} network error, retry ${newRetryCount}`);
          }
        }
      } else {
        for (const entry of batch) {
          const newRetryCount = (entry.retryCount ?? 0) + 1;
          const delay = nextRetryDelay(newRetryCount);
          await updateRetry(entry.id!, newRetryCount, now + delay);
          await markOutboxEntry(entry.id!, 'pending');
          result.failed++;
          result.incidents.push(`${entry.operationId} unexpected error, retry ${newRetryCount}`);
        }
      }
    }
  }

  for (const entry of collapsed) {
    if (entry.skip && entry.id !== undefined) {
      await removeFromOutbox(entry.id);
    }
  }

  return result;
}

export async function pullCatalogsIfStale(): Promise<void> {
  if (getNetworkMode() === 'offline') return;

  const lastSync = await getSyncMeta('catalog_last_sync') as number | undefined;
  if (lastSync && Date.now() - lastSync < CATALOG_TTL) return;

  const db = await getDB();

  for (const store of CATALOG_STORES) {
    try {
      const response = await apiClient.get(`/api/v1/${store}`);
      const items = Array.isArray(response.data)
        ? response.data
        : response.data.content ?? response.data.data ?? response.data._embedded?.[store] ?? [];
      const now = Date.now();
      const enriched = items.map((item: Record<string, unknown>) => ({ ...item, cachedAt: now }));
      await batchPut(store, enriched);
    } catch {}
  }

  await setSyncMeta('catalog_last_sync', Date.now());
}

export async function pullDeltaSync(): Promise<Map<string, PullResult>> {
  const results = new Map<string, PullResult>();

  if (getNetworkMode() === 'offline') return results;

  const db = await getDB();

  const processStore = async (store: string): Promise<void> => {
    let cursor = await getStoreCursor(store);
    let pulled = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await apiClient.get<SyncPullResponse>('/api/v1/sync/pull', {
          params: { entityType: store, cursor, limit: 100 },
        });
        const { entries, nextCursor, hasMore: more } = response.data;

        if (entries.length > 0) {
          await applyPullEntriesForStore(store, entries);
          pulled += entries.length;
        }

        if (nextCursor <= cursor) break;
        cursor = nextCursor;
        hasMore = more && entries.length > 0;
      } catch {
        hasMore = false;
      }
    }

    await setStoreCursor(store, cursor);
    results.set(store, { store, pulled, updatedCursor: cursor });
  };

  for (let i = 0; i < DELTA_STORES.length; i += CONCURRENCY) {
    const batch = DELTA_STORES.slice(i, i + CONCURRENCY);
    await Promise.allSettled(batch.map(processStore));
  }

  return results;
}

export async function applyPullEntriesForStore(store: string, entries: SyncLogEntry[]): Promise<void> {
  const db = await getDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = db.transaction(store as any, 'readwrite');

  for (const entry of entries) {
    if (entry.action === 'DELETE') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx as any).objectStore(store).delete(entry.entityId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx as any).objectStore(store).put({ ...entry.afterData, cachedAt: Date.now() });
    }
  }

  await tx.done;
}
