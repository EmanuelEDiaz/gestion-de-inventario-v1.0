import { z } from 'zod';

import type { DownloadChunk, CorruptionEntry } from '@/core/loading/types';
import { sha256 } from '@/core/utils/crypto';
import { apiClient } from '@/infrastructure/api/client';
import { getDB } from '@/infrastructure/storage/db';
import { appLogger } from '@/infrastructure/logging/appLogger';

const RETRY_DELAYS_MS = [1_000, 5_000, 15_000] as const;
const MAX_RETRIES = RETRY_DELAYS_MS.length;

export interface DownloadEntityOptions<T> {
  entityType: string;
  endpoint: string;
  idbStoreName: string;
  schema: z.ZodSchema<T>;
  pageSize?: number;
  signal?: AbortSignal;
  onProgress?: (page: number, totalPages: number) => void;
  userId: string;
}

export interface DownloadResult {
  ok: boolean;
  itemCount: number;
  chunksProcessed: number;
  chunksFailed: number;
  corrupted: number;
  errors: string[];
  aborted: boolean;
}

interface PageResponse<T> {
  content?: T[];
  totalPages?: number;
  totalElements?: number;
  size?: number;
  number?: number;
}

interface ChunkOutcome {
  ok: boolean;
  itemCount: number;
  corrupted: boolean;
  failed: boolean;
  error?: string;
}

export class DownloadQueueService {
  static readonly MAX_CONCURRENT = 3;

  static async downloadEntity<T>(options: DownloadEntityOptions<T>): Promise<DownloadResult> {
    const {
      entityType,
      endpoint,
      idbStoreName,
      schema,
      userId,
      signal,
      onProgress,
      pageSize = 100,
    } = options;

    const result: DownloadResult = {
      ok: false,
      itemCount: 0,
      chunksProcessed: 0,
      chunksFailed: 0,
      corrupted: 0,
      errors: [],
      aborted: false,
    };

    if (signal?.aborted) {
      result.aborted = true;
      return result;
    }

    return this.runWithLock(entityType, async () => {
      let firstPage: PageResponse<T> | null = null;
      let firstPageErr: Error | null = null;
      try {
        firstPage = await this.fetchPage<T>(endpoint, 0, pageSize, signal);
      } catch (err) {
        if (this.isAbortError(err)) {
          result.aborted = true;
          return result;
        }
        firstPageErr = err instanceof Error ? err : new Error(String(err));
      }

      if (firstPageErr) {
        result.ok = false;
        result.errors.push(`first page fetch failed: ${firstPageErr.message}`);
        appLogger.error(`[DownloadQueue] ${entityType} first page failed`, firstPageErr);
        return result;
      }

      const totalPages = firstPage?.totalPages ?? 1;
      const firstOutcome = await this.processChunk<T>({
        entityType,
        idbStoreName,
        schema,
        userId,
        page: 0,
        totalPages,
        response: firstPage as PageResponse<T>,
        signal,
      });
      this.accumulateOutcome(result, firstOutcome);
      onProgress?.(1, totalPages);

      if (totalPages <= 1) {
        result.ok = result.chunksFailed === 0;
        return result;
      }

      const remainingPages: number[] = [];
      for (let p = 1; p < totalPages; p++) remainingPages.push(p);

      const outcomes = await this.runConcurrent(
        remainingPages,
        this.MAX_CONCURRENT,
        async (page) => {
          let pageData: PageResponse<T>;
          try {
            pageData = await this.fetchPage<T>(endpoint, page, pageSize, signal);
          } catch (err) {
            if (this.isAbortError(err)) {
              return { ok: false, itemCount: 0, corrupted: false, failed: true, error: 'aborted' } as ChunkOutcome;
            }
            const errMsg = err instanceof Error ? err.message : String(err);
            appLogger.warn(`[DownloadQueue] ${entityType} page ${page} fetch failed`, err);
            return { ok: false, itemCount: 0, corrupted: false, failed: true, error: errMsg } as ChunkOutcome;
          }
          const outcome = await this.processChunk<T>({
            entityType,
            idbStoreName,
            schema,
            userId,
            page,
            totalPages,
            response: pageData,
            signal,
          });
          onProgress?.(page + 1, totalPages);
          return outcome;
        },
        signal,
      );

      for (const outcome of outcomes) this.accumulateOutcome(result, outcome);

      result.ok = result.chunksFailed === 0 && result.corrupted === 0;
      return result;
    });
  }

  static async fetchAllWithIntegrity<T>(
    endpoint: string,
    idbStoreName: string,
    schema: z.ZodSchema<T>,
    options: { signal?: AbortSignal; userId: string },
  ): Promise<DownloadResult> {
    const result: DownloadResult = {
      ok: false,
      itemCount: 0,
      chunksProcessed: 0,
      chunksFailed: 0,
      corrupted: 0,
      errors: [],
      aborted: false,
    };

    if (options.signal?.aborted) {
      result.aborted = true;
      return result;
    }

    return this.runWithLock(idbStoreName, async () => {
      let raw: T[] | null = null;
      let fetchErr: Error | null = null;
      let serverChecksum: string | undefined;
      try {
        const res = await apiClient.get<T[] | { content?: T[] } | { data?: T[] }>(endpoint, {
          signal: options.signal,
        });
        serverChecksum = this.extractChecksum(res.headers as Record<string, string> | undefined);
        raw = this.normalizeArrayResponse(res.data);
      } catch (err) {
        if (this.isAbortError(err)) {
          result.aborted = true;
          return result;
        }
        fetchErr = err instanceof Error ? err : new Error(String(err));
      }

      if (fetchErr || raw === null) {
        result.errors.push(fetchErr?.message ?? 'unknown fetch error');
        appLogger.error(`[DownloadQueue] ${idbStoreName} fetchAll failed`, fetchErr);
        return result;
      }

      if (serverChecksum) {
        const clientChecksum = await sha256(JSON.stringify(raw));
        if (serverChecksum !== clientChecksum) {
          const errMsg = `checksum mismatch for ${endpoint} (server=${serverChecksum}, client=${clientChecksum})`;
          appLogger.error(`[DownloadQueue] ${errMsg}`);
          await this.writeCorruption({
            entityType: idbStoreName,
            chunkKey: `${idbStoreName}-full`,
            rawPayload: JSON.stringify(raw),
            parseError: errMsg,
          });
          result.corrupted = 1;
          result.chunksFailed = 1;
          result.errors.push(errMsg);
          return result;
        }
      }

      const validItems: T[] = [];
      const errors: string[] = [];
      raw.forEach((item, idx) => {
        const parsed = schema.safeParse(item);
        if (parsed.success) {
          validItems.push(parsed.data as T);
        } else {
          errors.push(`index ${idx}: ${parsed.error.message}`);
        }
      });

      if (errors.length > 0 && validItems.length === 0) {
        const errMsg = `all ${raw.length} items failed validation in ${idbStoreName}`;
        appLogger.error(`[DownloadQueue] ${errMsg}`, errors);
        await this.writeCorruption({
          entityType: idbStoreName,
          chunkKey: `${idbStoreName}-full`,
          rawPayload: JSON.stringify(raw),
          parseError: errMsg,
        });
        result.corrupted = 1;
        result.chunksFailed = 1;
        result.errors.push(errMsg);
        return result;
      }

      try {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic store name
        const tx = (db as any).transaction([idbStoreName, 'downloadChunks'], 'readwrite');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic store name
        const target = (tx as any).objectStore(idbStoreName);
        for (const item of validItems) {
          target.put(item);
        }
        const chunkRecord: DownloadChunk = {
          chunkKey: `${idbStoreName}-full`,
          entityType: idbStoreName,
          page: 0,
          totalPages: 1,
          itemCount: validItems.length,
          checksum: serverChecksum ?? '',
          status: 'committed',
          retryCount: 0,
          userId: options.userId,
          committedAt: Date.now(),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic store name
        (tx as any).objectStore('downloadChunks').put(chunkRecord);
        await tx.done;

        result.itemCount = validItems.length;
        result.chunksProcessed = 1;
        if (errors.length > 0) {
          result.errors.push(`${errors.length} items skipped due to validation errors`);
        }
        result.ok = true;
        return result;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        result.chunksFailed = 1;
        result.errors.push(`idb commit failed: ${errMsg}`);
        appLogger.error(`[DownloadQueue] ${idbStoreName} idb commit failed`, err);
        return result;
      }
    });
  }

  private static async runWithLock<T>(entityType: string, fn: () => Promise<T>): Promise<T> {
    const hasLocks = typeof navigator !== 'undefined' && 'locks' in navigator;
    if (hasLocks) {
      return navigator.locks.request(`download-lock-${entityType}`, fn);
    }
    return fn();
  }

  private static async fetchPage<T>(
    endpoint: string,
    page: number,
    pageSize: number,
    signal: AbortSignal | undefined,
  ): Promise<PageResponse<T>> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${endpoint}${separator}page=${page}&size=${pageSize}`;
    const res = await apiClient.get<PageResponse<T>>(url, { signal });
    return res.data ?? {};
  }

  private static normalizeArrayResponse<T>(data: unknown): T[] | null {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.content)) return obj.content as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
      if (Array.isArray(obj.items)) return obj.items as T[];
    }
    return null;
  }

  private static extractChecksum(headers: Record<string, string> | undefined): string | undefined {
    if (!headers) return undefined;
    const raw = headers['x-content-checksum'] ?? headers['X-Content-Checksum'];
    if (!raw) return undefined;
    return raw.startsWith('sha256:') ? raw.slice('sha256:'.length) : raw;
  }

  private static async processChunk<T>(params: {
    entityType: string;
    idbStoreName: string;
    schema: z.ZodSchema<T>;
    userId: string;
    page: number;
    totalPages: number;
    response: PageResponse<T>;
    signal: AbortSignal | undefined;
  }): Promise<ChunkOutcome> {
    const { entityType, idbStoreName, schema, userId, page, totalPages, response } = params;
    const chunkKey = `${entityType}-${page}`;
    const items = response.content ?? [];
    const serverChecksum = ''; // server checksum is per-page response; not in headers here

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (params.signal?.aborted) {
        return { ok: false, itemCount: 0, corrupted: false, failed: true, error: 'aborted' };
      }
      const validation = this.validateItems(items, schema);
      if (!validation.ok) {
        const errMsg = `validation failed for ${chunkKey}: ${validation.errors.join('; ')}`;
        appLogger.error(`[DownloadQueue] ${errMsg}`);
        await this.writeCorruption({
          entityType,
          chunkKey,
          rawPayload: JSON.stringify(items),
          parseError: errMsg,
        });
        await this.writeChunkRecord({
          chunkKey,
          entityType,
          page,
          totalPages,
          itemCount: 0,
          checksum: serverChecksum,
          status: 'corrupted',
          retryCount: attempt,
          userId,
          failedReason: errMsg,
        });
        return { ok: false, itemCount: 0, corrupted: true, failed: false, error: errMsg };
      }

      try {
        await this.commitChunk({
          idbStoreName,
          chunkKey,
          entityType,
          page,
          totalPages,
          items: validation.items,
          checksum: serverChecksum,
          userId,
        });
        return { ok: true, itemCount: validation.items.length, corrupted: false, failed: false };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const isLast = attempt === MAX_RETRIES - 1;
        appLogger.warn(
          `[DownloadQueue] ${chunkKey} commit attempt ${attempt + 1}/${MAX_RETRIES} failed: ${errMsg}`,
        );
        if (isLast) {
          await this.writeChunkRecord({
            chunkKey,
            entityType,
            page,
            totalPages,
            itemCount: 0,
            checksum: serverChecksum,
            status: 'failed',
            retryCount: attempt + 1,
            userId,
            failedReason: errMsg,
          });
          return { ok: false, itemCount: 0, corrupted: false, failed: true, error: errMsg };
        }
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }

    return { ok: false, itemCount: 0, corrupted: false, failed: true, error: 'exhausted retries' };
  }

  private static validateItems<T>(
    items: unknown[],
    schema: z.ZodSchema<T>,
  ): { ok: true; items: T[] } | { ok: false; errors: string[] } {
    const valid: T[] = [];
    const errors: string[] = [];
    items.forEach((item, idx) => {
      const parsed = schema.safeParse(item);
      if (parsed.success) {
        valid.push(parsed.data as T);
      } else {
        errors.push(`index ${idx}: ${parsed.error.message}`);
      }
    });
    if (valid.length === 0) return { ok: false, errors };
    return { ok: true, items: valid };
  }

  private static async commitChunk<T>(params: {
    idbStoreName: string;
    chunkKey: string;
    entityType: string;
    page: number;
    totalPages: number;
    items: T[];
    checksum: string;
    userId: string;
  }): Promise<void> {
    const db = await getDB();
    // Dynamic store name — idb's typed transaction requires schema knowledge.
    // Use a minimal structural cast (the same pattern used in db.ts) to access
    // the generic objectStore/put/done methods without bringing in a typed schema.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic store name
    const tx = (db as any).transaction([params.idbStoreName, 'downloadChunks'], 'readwrite');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic store name
    const target = (tx as any).objectStore(params.idbStoreName);
    for (const item of params.items) target.put(item);

    const chunkRecord: DownloadChunk = {
      chunkKey: params.chunkKey,
      entityType: params.entityType,
      page: params.page,
      totalPages: params.totalPages,
      itemCount: params.items.length,
      checksum: params.checksum,
      status: 'committed',
      retryCount: 0,
      userId: params.userId,
      committedAt: Date.now(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic store name
    (tx as any).objectStore('downloadChunks').put(chunkRecord);

    await tx.done;
  }

  private static async writeCorruption(params: {
    entityType: string;
    chunkKey: string;
    rawPayload: string;
    parseError: string;
  }): Promise<void> {
    try {
      const db = await getDB();
      const entry: CorruptionEntry = {
        entityType: params.entityType,
        chunkKey: params.chunkKey,
        rawPayload: params.rawPayload,
        parseError: params.parseError,
        receivedAt: Date.now(),
        status: 'pending',
      };
      await db.put('corruptionQueue', entry);
      window.dispatchEvent(new CustomEvent('corruption-detected', {
        detail: { idbStoreName: params.entityType, chunkKey: params.chunkKey },
      }));
    } catch (err) {
      appLogger.error('[DownloadQueue] failed to persist corruption entry', err);
    }
  }

  private static async writeChunkRecord(params: {
    chunkKey: string;
    entityType: string;
    page: number;
    totalPages: number;
    itemCount: number;
    checksum: string;
    status: DownloadChunk['status'];
    retryCount: number;
    userId: string;
    failedReason?: string;
  }): Promise<void> {
    try {
      const db = await getDB();
      const record: DownloadChunk = {
        chunkKey: params.chunkKey,
        entityType: params.entityType,
        page: params.page,
        totalPages: params.totalPages,
        itemCount: params.itemCount,
        checksum: params.checksum,
        status: params.status,
        retryCount: params.retryCount,
        userId: params.userId,
        failedReason: params.failedReason,
      };
      if (params.status === 'committed') record.committedAt = Date.now();
      await db.put('downloadChunks', record);
    } catch (err) {
      appLogger.error('[DownloadQueue] failed to persist chunk record', err);
    }
  }

  private static async runConcurrent<TIn, TOut>(
    items: TIn[],
    limit: number,
    worker: (item: TIn) => Promise<TOut>,
    signal: AbortSignal | undefined,
  ): Promise<TOut[]> {
    const results: TOut[] = new Array(items.length);
    let cursor = 0;
    const runners: Promise<void>[] = [];
    const concurrency = Math.max(1, Math.min(limit, items.length));
    for (let i = 0; i < concurrency; i++) {
      runners.push(
        (async () => {
          while (true) {
            if (signal?.aborted) return;
            const idx = cursor++;
            if (idx >= items.length) return;
            const item = items[idx] as TIn;
            const value = await worker(item);
            results[idx] = value;
          }
        })(),
      );
    }
    await Promise.all(runners);
    return results;
  }

  private static isAbortError(err: unknown): boolean {
    if (!err) return false;
    if (err instanceof DOMException && err.name === 'AbortError') return true;
    if (err instanceof Error && err.name === 'AbortError') return true;
    if (err instanceof Error && /abort/i.test(err.message)) return true;
    return false;
  }

  private static accumulateOutcome(result: DownloadResult, outcome: ChunkOutcome): void {
    if (outcome.ok) {
      result.itemCount += outcome.itemCount;
      result.chunksProcessed += 1;
    } else if (outcome.corrupted) {
      result.corrupted += 1;
      result.chunksFailed += 1;
      if (outcome.error) result.errors.push(outcome.error);
    } else if (outcome.failed) {
      result.chunksFailed += 1;
      if (outcome.error) result.errors.push(outcome.error);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
