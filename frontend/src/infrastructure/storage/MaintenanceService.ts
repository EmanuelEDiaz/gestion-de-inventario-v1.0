import { getDB } from '@/infrastructure/storage/db';
import { appLogger } from '@/infrastructure/logging/appLogger';
import { useSchedulerState } from '@/core/loading/schedulerState';
import { deleteOPFSFile } from '@/infrastructure/maps/opfs-utils';

const PRUNE_INTERVAL_MS = 30 * 60 * 1000;
const QUOTA_WARN_THRESHOLD = 0.2;
const QUOTA_CRITICAL_THRESHOLD = 0.1;
const MAX_IMAGE_CACHE_BYTES = 100 * 1024 * 1024;

interface DatePruneRule {
  storeName: string;
  indexName: string;
  fieldName: string;
  cutoffDays: number;
  format: 'iso-string' | 'timestamp';
}

const DATE_PRUNE_RULES: DatePruneRule[] = [
  { storeName: 'sales', indexName: 'by-sale-date', fieldName: 'saleDate', cutoffDays: 90, format: 'iso-string' },
  { storeName: 'movements', indexName: 'by-occurred-at', fieldName: 'occurredAt', cutoffDays: 90, format: 'iso-string' },
  { storeName: 'purchases', indexName: 'by-date', fieldName: 'cachedAt', cutoffDays: 180, format: 'timestamp' },
  { storeName: 'transfers', indexName: 'by-date', fieldName: 'cachedAt', cutoffDays: 90, format: 'timestamp' },
  { storeName: 'adjustments', indexName: 'by-date', fieldName: 'cachedAt', cutoffDays: 90, format: 'timestamp' },
  { storeName: 'returns', indexName: 'by-date', fieldName: 'cachedAt', cutoffDays: 90, format: 'timestamp' },
  { storeName: 'notifications', indexName: 'by-date', fieldName: 'cachedAt', cutoffDays: 30, format: 'timestamp' },
];

export class MaintenanceService {
  static async runOnce(): Promise<void> {
    const service = new MaintenanceService();
    await service.runAll();
  }

  private timerId: ReturnType<typeof setInterval> | null = null;
  private running = false;

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    await this.runAll();
    this.timerId = setInterval(() => this.runAll(), PRUNE_INTERVAL_MS);
    appLogger.info('[Maintenance] Service started');
  }

  stop(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
    this.running = false;
  }

  async runAll(): Promise<void> {
    const { isPruning } = useSchedulerState.getState();
    if (isPruning) return;
    useSchedulerState.getState().setPruning(true);
    try {
      await this.checkQuota();
      await this.purgeAppLogs();
      await this.runDatePruning();
      await this.cleanupDownloadChunks();
      await this.cleanupTempFiles();
      await this.evictImageCacheLRU();
    } catch (err) {
      appLogger.error('[Maintenance] Error during maintenance cycle', err);
    } finally {
      useSchedulerState.getState().setPruning(false);
    }
  }

  private async checkQuota(): Promise<void> {
    try {
      if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return;
      const { usage, quota } = await navigator.storage.estimate();
      if (!quota || !usage) return;
      const pctFree = 1 - usage / quota;
      if (pctFree < QUOTA_CRITICAL_THRESHOLD) {
        appLogger.warn(
          `[Maintenance] Almacenamiento crítico: ${(pctFree * 100).toFixed(0)}% libre`,
          { quotaUsageMb: Math.round(usage / 1024 / 1024), quotaTotalMb: Math.round(quota / 1024 / 1024) },
        );
      } else if (pctFree < QUOTA_WARN_THRESHOLD) {
        appLogger.warn(
          `[Maintenance] Almacenamiento bajo: ${(pctFree * 100).toFixed(0)}% libre`,
        );
      }
    } catch {
    }
  }

  private async purgeAppLogs(): Promise<void> {
    try {
      const db = await getDB();
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const toDelete: number[] = [];
      let count = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cursor = await (db as any).transaction('appLogs').store.index('by-timestamp').openCursor(null, 'prev');
      while (cursor) {
        count++;
        if (count > 5000 || cursor.value.timestamp < cutoff) {
          toDelete.push(cursor.value.id);
        }
        cursor = await cursor.continue();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = (db as any).transaction('appLogs', 'readwrite');
      for (const id of toDelete) {
        await tx.objectStore('appLogs').delete(id);
      }
      await tx.done;
      if (toDelete.length > 0) appLogger.info(`[Maintenance] Purged ${toDelete.length} old appLogs`);
    } catch (err) {
      appLogger.error('[Maintenance] Error purging appLogs', err);
    }
  }

  private async runDatePruning(): Promise<void> {
    const now = Date.now();
    for (const rule of DATE_PRUNE_RULES) {
      try {
        await this.pruneByRule(rule, now);
      } catch (err) {
        appLogger.error(`[Maintenance] Error pruning ${rule.storeName}`, err);
      }
    }
  }

  private async pruneByRule(rule: DatePruneRule, now: number): Promise<void> {
    const db = await getDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = (db as any).transaction(rule.storeName, 'readonly');
    const store = tx.objectStore(rule.storeName);
    const sample = await store.getAll(null, 1);
    if (sample.length === 0) return;

    const sampleVal = sample[0]?.[rule.fieldName];

    if (rule.format === 'iso-string') {
      if (typeof sampleVal !== 'string') {
        appLogger.warn(`[Maintenance] ${rule.storeName}.${rule.fieldName} no es string (${typeof sampleVal}) — skipping`);
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}/.test(sampleVal)) {
        appLogger.warn(`[Maintenance] ${rule.storeName}.${rule.fieldName} no es ISO8601: "${sampleVal}" — skipping`);
        return;
      }
      const cutoffDate = new Date(now - rule.cutoffDays * 86400000).toISOString().slice(0, 10);
      let purged = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rwTx = (db as any).transaction(rule.storeName, 'readwrite');
      const rwStore = rwTx.objectStore(rule.storeName);
      const index = rwStore.index(rule.indexName);
      let cursor = await index.openCursor();
      while (cursor) {
        const val = cursor.value[rule.fieldName];
        if (typeof val === 'string' && val < cutoffDate) {
          await cursor.delete();
          purged++;
        }
        cursor = await cursor.continue();
      }
      await rwTx.done;
      if (purged > 0) appLogger.info(`[Maintenance] ${rule.storeName}: purged ${purged} registros anteriores a ${cutoffDate}`);
    } else {
      const cutoffTs = now - rule.cutoffDays * 86400000;
      let purged = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rwTx = (db as any).transaction(rule.storeName, 'readwrite');
      const rwStore = rwTx.objectStore(rule.storeName);
      const index = rwStore.index(rule.indexName);
      let cursor = await index.openCursor();
      while (cursor) {
        const val = cursor.value[rule.fieldName];
        if (typeof val === 'number' && val < cutoffTs) {
          await cursor.delete();
          purged++;
        }
        cursor = await cursor.continue();
      }
      await rwTx.done;
      if (purged > 0) appLogger.info(`[Maintenance] ${rule.storeName}: purged ${purged} registros anteriores a ${new Date(cutoffTs).toISOString()}`);
    }
  }

  private async cleanupDownloadChunks(): Promise<void> {
    try {
      const db = await getDB();
      const maxAge = 24 * 60 * 60 * 1000;
      const cutoff = Date.now() - maxAge;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const index = (db as any).transaction('downloadChunks').store.index('by-status');
      let deleted = 0;
      let cursor = await index.openCursor(IDBKeyRange.only('committed'));
      while (cursor) {
        const committedAt: number | undefined = cursor.value.committedAt;
        if ((committedAt ?? 0) < cutoff) {
          await cursor.delete();
          deleted++;
        }
        cursor = await cursor.continue();
      }
      let cursor2 = await index.openCursor(IDBKeyRange.only('failed'));
      while (cursor2) {
        if (cursor2.value.retryCount >= 3) {
          await cursor2.delete();
          deleted++;
        }
        cursor2 = await cursor2.continue();
      }
      if (deleted > 0) appLogger.info(`[Maintenance] Purged ${deleted} old downloadChunks`);
    } catch (err) {
      appLogger.error('[Maintenance] Error cleaning downloadChunks', err);
    }
  }

  private async cleanupTempFiles(): Promise<void> {
    try {
      if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return;
      const root = await navigator.storage.getDirectory();
      const entries: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const [name] of (root as any).entries()) {
        if ((name as string).endsWith('.tmp') || (name as string).startsWith('__')) entries.push(name as string);
      }
      await Promise.allSettled(entries.map(name => root.removeEntry(name).catch(() => {})));
      if (entries.length > 0) appLogger.info(`[Maintenance] Cleaned ${entries.length} temp files from OPFS`);
    } catch (err) {
      appLogger.error('[Maintenance] Error cleaning temp files', err);
    }
  }

  private async evictImageCacheLRU(): Promise<void> {
    try {
      const db = await getDB();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all = await (db as any).getAllFromIndex('imageIndex', 'by-last-access') as Array<{
        key: string; opfsPath: string; sizeBytes: number;
      }>;
      const total = all.reduce((sum, e) => sum + e.sizeBytes, 0);
      if (total <= MAX_IMAGE_CACHE_BYTES) return;

      let evicted = 0;
      let freed = 0;
      for (const entry of all) {
        if (total - freed <= MAX_IMAGE_CACHE_BYTES) break;
        await deleteOPFSFile(entry.opfsPath).catch(() => {});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any).delete('imageIndex', entry.key);
        freed += entry.sizeBytes;
        evicted++;
      }
      if (evicted > 0) appLogger.info(`[Maintenance] LRU evicted ${evicted} entries, freed ${(freed / 1024 / 1024).toFixed(1)}MB`);
    } catch (err) {
      appLogger.error('[Maintenance] Error in LRU eviction', err);
    }
  }
}
