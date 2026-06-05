import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBackgroundTasksStore } from '@/core/loading/backgroundTasksStore';
import { useAppLoaderStore } from '@/core/loading/appLoaderStore';

vi.mock('@/infrastructure/storage/db', () => ({
  getSyncMeta: vi.fn(),
  setSyncMeta: vi.fn(),
  getCachedCount: vi.fn(),
  DB_NAME: 'inventory-offline',
  DB_VERSION: 6,
}));

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

vi.mock('@/infrastructure/logging/appLogger', () => ({
  appLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { getSyncMeta, getCachedCount } from '@/infrastructure/storage/db';
import { openDB as idbOpenDB } from 'idb';

const STORAGE_HANDLER: { getDirectory: ReturnType<typeof vi.fn> } = {
  getDirectory: vi.fn(),
};

function ensureNavigatorStorage(): void {
  const nav = navigator as unknown as { storage?: { getDirectory?: unknown } };
  if (!nav.storage || !('getDirectory' in (nav.storage as object))) {
    Object.defineProperty(navigator, 'storage', {
      value: STORAGE_HANDLER,
      writable: true,
      configurable: true,
    });
  }
}

function makeOpfsMock(opts: { fileExists: boolean; bytes?: ArrayBuffer | Uint8Array }): {
  rootHandle: { getFileHandle: ReturnType<typeof vi.fn>; getDirectoryHandle: ReturnType<typeof vi.fn> };
  fileHandle: { getFile: ReturnType<typeof vi.fn>; createWritable: ReturnType<typeof vi.fn> };
} {
  const fileHandle = {
    getFile: vi.fn(async () => ({
      arrayBuffer: async (): Promise<ArrayBuffer> => {
        if (!opts.bytes) return new ArrayBuffer(0);
        if (opts.bytes instanceof ArrayBuffer) return opts.bytes;
        return opts.bytes.buffer.slice(0) as ArrayBuffer;
      },
    })),
    createWritable: vi.fn(async () => ({
      write: vi.fn(async () => undefined),
      close: vi.fn(async () => undefined),
    })),
  };
  const rootHandle: {
    getFileHandle: ReturnType<typeof vi.fn>;
    getDirectoryHandle: ReturnType<typeof vi.fn>;
  } = {
    getFileHandle: vi.fn(async () => {
      if (!opts.fileExists) {
        throw Object.assign(new Error('Not found'), { name: 'NotFoundError' });
      }
      return fileHandle;
    }),
    getDirectoryHandle: vi.fn(async () => rootHandle),
  };
  STORAGE_HANDLER.getDirectory.mockResolvedValue(rootHandle);
  return { rootHandle, fileHandle };
}

function resetStores(): void {
  useBackgroundTasksStore.setState((state) => {
    const reset: Record<string, unknown> = {};
    for (const id of Object.keys(state.tasks)) {
      reset[id] = {
        id,
        label: '',
        completed: 0,
        total: 0,
        status: 'idle',
        error: undefined,
        startedAt: undefined,
        finishedAt: undefined,
      };
    }
    return { tasks: reset as typeof state.tasks };
  });
  useAppLoaderStore.setState({ availability: 'blocking' });
}

async function loadRunners(): Promise<typeof import('./useBackgroundTasks')> {
  return import('./useBackgroundTasks');
}

const MATCH_HASH_BYTES = new Uint8Array(32).fill(0xab);
const MATCH_HASH_HEX = 'ab'.repeat(32);
const MATCH_CHECKSUM = `sha256:${MATCH_HASH_HEX}`;

describe('useBackgroundTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    ensureNavigatorStorage();
    vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(
      MATCH_HASH_BYTES.buffer.slice(0) as ArrayBuffer,
    );
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('verifyMapBackground skips with not_downloaded when meta is absent', async () => {
    vi.mocked(getSyncMeta).mockResolvedValue(undefined);
    const { verifyMapBackground } = await loadRunners();

    await verifyMapBackground();

    const task = useBackgroundTasksStore.getState().tasks.map_verify;
    expect(task.status).toBe('skipped');
    expect(task.error).toBe('not_downloaded');
    expect(useAppLoaderStore.getState().availability).toBe('blocking');
  });

  it('verifyMapBackground skips with opfs_missing when meta exists but file is absent', async () => {
    vi.mocked(getSyncMeta).mockResolvedValue({
      key: 'map-pmtiles',
      filename: 'cuba.pmtiles',
      version: '1',
      serverChecksum: MATCH_CHECKSUM,
      clientChecksum: MATCH_CHECKSUM,
      sizeBytes: 100,
      installedAt: Date.now(),
    });
    makeOpfsMock({ fileExists: false });
    const { verifyMapBackground } = await loadRunners();

    await verifyMapBackground();

    const task = useBackgroundTasksStore.getState().tasks.map_verify;
    expect(task.status).toBe('skipped');
    expect(task.error).toBe('opfs_missing');
    expect(useAppLoaderStore.getState().availability).toBe('blocking');
  });

  it('verifyMapBackground marks degraded and fails when checksum mismatches', async () => {
    vi.mocked(getSyncMeta).mockResolvedValue({
      key: 'map-pmtiles',
      filename: 'cuba.pmtiles',
      version: '1',
      serverChecksum: 'sha256:' + 'cc'.repeat(32),
      clientChecksum: '',
      sizeBytes: 100,
      installedAt: Date.now(),
    });
    makeOpfsMock({ fileExists: true, bytes: new TextEncoder().encode('map-bytes') });
    const { verifyMapBackground } = await loadRunners();

    await verifyMapBackground();

    const task = useBackgroundTasksStore.getState().tasks.map_verify;
    expect(task.status).toBe('failed');
    expect(task.error).toBe('checksum_mismatch');
    expect(useAppLoaderStore.getState().availability).toBe('degraded');
  });

  it('verifyMapBackground completes when checksum matches', async () => {
    vi.mocked(getSyncMeta).mockResolvedValue({
      key: 'map-pmtiles',
      filename: 'cuba.pmtiles',
      version: '1',
      serverChecksum: MATCH_CHECKSUM,
      clientChecksum: '',
      sizeBytes: 100,
      installedAt: Date.now(),
    });
    makeOpfsMock({ fileExists: true, bytes: new TextEncoder().encode('map-bytes') });
    const { verifyMapBackground } = await loadRunners();

    await verifyMapBackground();

    const task = useBackgroundTasksStore.getState().tasks.map_verify;
    expect(task.status).toBe('done');
    expect(useAppLoaderStore.getState().availability).toBe('blocking');
  });

  it('precacheOfflineRoute completes when fetch returns 200', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    const { precacheOfflineRoute } = await loadRunners();

    await precacheOfflineRoute();

    const task = useBackgroundTasksStore.getState().tasks.precache_routes;
    expect(task.status).toBe('done');
    expect(useAppLoaderStore.getState().availability).toBe('blocking');
  });

  it('precacheOfflineRoute fails on HTTP 500 without degrading availability', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);
    const { precacheOfflineRoute } = await loadRunners();

    await precacheOfflineRoute();

    const task = useBackgroundTasksStore.getState().tasks.precache_routes;
    expect(task.status).toBe('failed');
    expect(task.error).toContain('500');
    expect(useAppLoaderStore.getState().availability).toBe('blocking');
  });

  it('prefetchImagesBackground does not start the task when no products have images', async () => {
    vi.mocked(getCachedCount).mockResolvedValue(3);
    vi.mocked(idbOpenDB).mockResolvedValue({
      getAll: vi.fn(async () => [
        { id: 'p1', mainImage: null },
        { id: 'p2', mainImage: null },
        { id: 'p3', mainImage: null },
      ]),
    } as never);
    const { prefetchImagesBackground } = await loadRunners();

    await prefetchImagesBackground();

    const task = useBackgroundTasksStore.getState().tasks.image_prefetch;
    expect(task.status).toBe('idle');
    expect(task.total).toBe(0);
  });

  it('prefetchImagesBackground completes the task when products have images', async () => {
    vi.mocked(getCachedCount).mockResolvedValue(2);
    vi.mocked(idbOpenDB).mockResolvedValue({
      getAll: vi.fn(async () => [
        { id: 'p1', mainImage: 'img-1.jpg' },
        { id: 'p2', mainImage: 'img-2.jpg' },
      ]),
    } as never);
    makeOpfsMock({ fileExists: true });
    const { prefetchImagesBackground } = await loadRunners();

    await prefetchImagesBackground();

    const task = useBackgroundTasksStore.getState().tasks.image_prefetch;
    expect(task.status).toBe('done');
    expect(task.total).toBe(2);
    expect(task.completed).toBe(2);
  });
});
