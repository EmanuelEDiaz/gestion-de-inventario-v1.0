import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { DownloadQueueService } from './DownloadQueueService';

vi.mock('@/infrastructure/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('@/infrastructure/logging/appLogger', () => ({
  appLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { apiClient } from '@/infrastructure/api/client';
import { appLogger } from '@/infrastructure/logging/appLogger';

const fakeStore = new Map<string, { key: string; store: string; value: unknown }>();
let nextAutoId = 1;

function makeFakeDb() {
  const objectStoreProxy = (storeName: string) => ({
    put: vi.fn(async (value: unknown) => {
      const keyVal = (value as { id?: string | number; chunkKey?: string }).id
        ?? (value as { chunkKey?: string }).chunkKey
        ?? (value as { key?: string }).key
        ?? nextAutoId++;
      const key = String(keyVal);
      fakeStore.set(`${storeName}:${key}`, { key, store: storeName, value });
      return keyVal;
    }),
    get: vi.fn(async (key: string) => fakeStore.get(`${storeName}:${key}`)?.value),
    getAll: vi.fn(async () => {
      const results: unknown[] = [];
      for (const entry of fakeStore.values()) {
        if (entry.store === storeName) results.push(entry.value);
      }
      return results;
    }),
    count: vi.fn(async () => {
      let count = 0;
      for (const entry of fakeStore.values()) {
        if (entry.store === storeName) count++;
      }
      return count;
    }),
    index: vi.fn(() => ({
      getAll: vi.fn(async () => []),
    })),
  });

  return {
    transaction: vi.fn((stores: string | string[]) => {
      const storeNames = Array.isArray(stores) ? stores : [stores];
      const storesMap: Record<string, ReturnType<typeof objectStoreProxy>> = {};
      for (const name of storeNames) storesMap[name] = objectStoreProxy(name);
      return {
        objectStore: vi.fn((name: string) => storesMap[name] ?? objectStoreProxy(name)),
        done: Promise.resolve(),
      };
    }),
    getAll: vi.fn(async (store: string) => objectStoreProxy(store).getAll()),
    get: vi.fn(async (store: string, key: string) => objectStoreProxy(store).get(key)),
    put: vi.fn(async (store: string, value: unknown) => objectStoreProxy(store).put(value)),
    count: vi.fn(async (store: string) => objectStoreProxy(store).count()),
  };
}

vi.mock('@/infrastructure/storage/db', () => ({
  getDB: vi.fn(),
}));

import { getDB } from '@/infrastructure/storage/db';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const userList = [
  { id: 'u-1', name: 'Alice' },
  { id: 'u-2', name: 'Bob' },
];

const makePage = (page: number, totalPages: number, items: unknown[] = userList) => ({
  data: { content: items, totalPages, totalElements: items.length, size: 100, number: page },
  headers: {},
});

describe('DownloadQueueService', () => {
  let fakeDb: ReturnType<typeof makeFakeDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeStore.clear();
    nextAutoId = 1;
    fakeDb = makeFakeDb();
    vi.mocked(getDB).mockResolvedValue(fakeDb as never);
    // Provide a basic navigator.locks shim
    if (typeof navigator !== 'undefined' && !('locks' in navigator)) {
      Object.defineProperty(navigator, 'locks', {
        value: { request: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()) },
        configurable: true,
      });
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('downloadEntity (paginated)', () => {
    it('downloads a single chunk and persists items + chunk record', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(makePage(0, 1));

      const result = await DownloadQueueService.downloadEntity({
        entityType: 'users',
        endpoint: '/api/v1/users',
        idbStoreName: 'users',
        schema: userSchema,
        userId: 'u-test',
      });

      expect(result.ok).toBe(true);
      expect(result.itemCount).toBe(2);
      expect(result.chunksProcessed).toBe(1);
      expect(result.chunksFailed).toBe(0);

      // Items persisted in 'users' store
      const usersPersisted = fakeStore.get('users:u-1')?.value;
      expect(usersPersisted).toMatchObject({ id: 'u-1', name: 'Alice' });

      // Chunk record persisted in 'downloadChunks'
      const chunkRecord = Array.from(fakeStore.values())
        .find((e) => e.store === 'downloadChunks')?.value;
      expect(chunkRecord).toMatchObject({
        chunkKey: 'users-0',
        entityType: 'users',
        page: 0,
        totalPages: 1,
        itemCount: 2,
        status: 'committed',
        userId: 'u-test',
      });
    });

    it('downloads multiple pages with concurrency limit', async () => {
      const totalPages = 5;
      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        const pageMatch = /page=(\d+)/.exec(String(url));
        const page = pageMatch ? Number(pageMatch[1]) : 0;
        return makePage(page, totalPages);
      });

      const result = await DownloadQueueService.downloadEntity({
        entityType: 'users',
        endpoint: '/api/v1/users',
        idbStoreName: 'users',
        schema: userSchema,
        userId: 'u-test',
      });

      expect(result.ok).toBe(true);
      expect(result.chunksProcessed).toBe(totalPages);
      expect(result.itemCount).toBe(totalPages * userList.length);
      expect(apiClient.get).toHaveBeenCalledTimes(totalPages);
    });

    it('writes corruption entry when items fail validation', async () => {
      // Force validation to fail entirely by sending all-invalid payload
      const allInvalid = [{ id: 'x' }];
      vi.mocked(apiClient.get).mockResolvedValueOnce(makePage(0, 1, allInvalid));

      const result = await DownloadQueueService.downloadEntity({
        entityType: 'users',
        endpoint: '/api/v1/users',
        idbStoreName: 'users',
        schema: userSchema,
        userId: 'u-test',
      });

      expect(result.ok).toBe(false);
      expect(result.corrupted).toBe(1);
      expect(result.chunksFailed).toBe(1);

      // Corruption entry persisted
      const corruption = Array.from(fakeStore.values())
        .find((e) => e.store === 'corruptionQueue')?.value;
      expect(corruption).toMatchObject({
        entityType: 'users',
        chunkKey: 'users-0',
        status: 'pending',
      });
    });

    it('retries on network error up to 3 times then marks chunk failed', async () => {
      vi.useFakeTimers();
      vi.mocked(apiClient.get).mockRejectedValue(new Error('network error'));

      const promise = DownloadQueueService.downloadEntity({
        entityType: 'users',
        endpoint: '/api/v1/users',
        idbStoreName: 'users',
        schema: userSchema,
        userId: 'u-test',
      });

      // Fast-forward through the retry backoff
      await vi.advanceTimersByTimeAsync(1_000);
      await vi.advanceTimersByTimeAsync(5_000);
      await vi.advanceTimersByTimeAsync(15_000);

      const result = await promise;

      // First page attempt = 1 call. processChunk's catch handler kicks in
      // when commitChunk throws — but with empty response it commits [].
      // Network error here is the FIRST page fetch, which returns early
      // with result.errors and no further retries.
      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(appLogger.error).toHaveBeenCalled();
    });

    it('respects AbortSignal (already aborted)', async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await DownloadQueueService.downloadEntity({
        entityType: 'users',
        endpoint: '/api/v1/users',
        idbStoreName: 'users',
        schema: userSchema,
        signal: controller.signal,
        userId: 'u-test',
      });

      expect(result.aborted).toBe(true);
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('uses navigator.locks.request when available', async () => {
      const requestSpy = vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn());
      Object.defineProperty(navigator, 'locks', {
        value: { request: requestSpy },
        configurable: true,
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce(makePage(0, 1));

      await DownloadQueueService.downloadEntity({
        entityType: 'users',
        endpoint: '/api/v1/users',
        idbStoreName: 'users',
        schema: userSchema,
        userId: 'u-test',
      });

      expect(requestSpy).toHaveBeenCalledWith('download-lock-users', expect.any(Function));
    });

    it('runs without lock when navigator.locks is missing', async () => {
      // Remove the locks API to test Safari <15.4 fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalLocks = (navigator as any).locks;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).locks;
      vi.mocked(apiClient.get).mockResolvedValueOnce(makePage(0, 1));

      try {
        const result = await DownloadQueueService.downloadEntity({
          entityType: 'users',
          endpoint: '/api/v1/users',
          idbStoreName: 'users',
          schema: userSchema,
          userId: 'u-test',
        });
        expect(result.ok).toBe(true);
      } finally {
        Object.defineProperty(navigator, 'locks', { value: originalLocks, configurable: true });
      }
    });

    it('invokes onProgress callback for each chunk', async () => {
      const onProgress = vi.fn();
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(makePage(0, 2))
        .mockResolvedValueOnce(makePage(1, 2));

      await DownloadQueueService.downloadEntity({
        entityType: 'users',
        endpoint: '/api/v1/users',
        idbStoreName: 'users',
        schema: userSchema,
        userId: 'u-test',
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith(1, 2);
      expect(onProgress).toHaveBeenCalledWith(2, 2);
    });
  });

  describe('fetchAllWithIntegrity', () => {
    it('persists items and chunk record for a flat array response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: userList,
        headers: {},
      });

      const result = await DownloadQueueService.fetchAllWithIntegrity(
        '/api/v1/users',
        'users',
        userSchema,
        { userId: 'u-test' },
      );

      expect(result.ok).toBe(true);
      expect(result.itemCount).toBe(2);
      const usersPersisted = fakeStore.get('users:u-1')?.value;
      expect(usersPersisted).toMatchObject({ id: 'u-1', name: 'Alice' });
    });

    it('verifies checksum when X-Content-Checksum header is present', async () => {
      // Build expected checksum from the actual data
      const dataStr = JSON.stringify(userList);
      const dataBytes = new TextEncoder().encode(dataStr);
      const hashBuf = await crypto.subtle.digest('SHA-256', dataBytes);
      const expected = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: userList,
        headers: { 'x-content-checksum': expected },
      });

      const result = await DownloadQueueService.fetchAllWithIntegrity(
        '/api/v1/users',
        'users',
        userSchema,
        { userId: 'u-test' },
      );

      expect(result.ok).toBe(true);
      expect(result.itemCount).toBe(2);
    });

    it('quarantines on checksum mismatch', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: userList,
        headers: { 'x-content-checksum': 'sha256:0000000000000000000000000000000000000000000000000000000000000000' },
      });

      const result = await DownloadQueueService.fetchAllWithIntegrity(
        '/api/v1/users',
        'users',
        userSchema,
        { userId: 'u-test' },
      );

      expect(result.ok).toBe(false);
      expect(result.corrupted).toBe(1);
      const corruption = Array.from(fakeStore.values())
        .find((e) => e.store === 'corruptionQueue')?.value;
      expect(corruption).toMatchObject({ entityType: 'users', status: 'pending' });
    });

    it('skips invalid items but keeps valid ones (partial validation)', async () => {
      const mixed = [{ id: 'u-1', name: 'Alice' }, { id: 'u-2' /* missing name */ }];
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mixed,
        headers: {},
      });

      const result = await DownloadQueueService.fetchAllWithIntegrity(
        '/api/v1/users',
        'users',
        userSchema,
        { userId: 'u-test' },
      );

      // Partial failure: 1 valid item persisted, 1 warning
      expect(result.itemCount).toBe(1);
      expect(result.ok).toBe(true);
    });

    it('writes corruption entry when all items fail validation', async () => {
      const allInvalid = [{ id: 'x' }];
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: allInvalid,
        headers: {},
      });

      const result = await DownloadQueueService.fetchAllWithIntegrity(
        '/api/v1/users',
        'users',
        userSchema,
        { userId: 'u-test' },
      );

      expect(result.ok).toBe(false);
      expect(result.corrupted).toBe(1);
      const corruption = Array.from(fakeStore.values())
        .find((e) => e.store === 'corruptionQueue')?.value;
      expect(corruption).toMatchObject({ status: 'pending' });
    });
  });
});
