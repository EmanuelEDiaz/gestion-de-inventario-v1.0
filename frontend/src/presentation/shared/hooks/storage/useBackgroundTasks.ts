import {
  useBackgroundTasksStore,
  type BackgroundTaskId,
} from '@/core/loading/backgroundTasksStore';
import { useAppLoaderStore } from '@/core/loading/appLoaderStore';
import {
  getMapMeta,
  setMapMeta,
  opfsFileExists,
  readOPFSFile,
  writeOPFSFile,
} from '@/infrastructure/maps/opfs-utils';
import { sha256Hex } from '@/infrastructure/maps/sha256-utils';
import { appLogger } from '@/infrastructure/logging/appLogger';
import { getCachedCount, DB_NAME, DB_VERSION } from '@/infrastructure/storage/db';

const MAP_FILENAME = 'cuba.pmtiles';
const OFFLINE_ROUTE = '/~offline';
const PRECACHE_TIMEOUT_MS = 5_000;
const IMAGE_PREFETCH_LIMIT = 50;
const IMAGE_PREFETCH_CONCURRENCY = 2;
const BATTERY_LOW_THRESHOLD = 0.2;
const PRODUCT_IMAGE_PATH_PREFIX = 'products';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function getBatteryState(): Promise<{ level: number; charging: boolean } | null> {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<unknown>;
  };
  if (typeof nav.getBattery !== 'function') return null;
  try {
    const b = (await nav.getBattery()) as { level: number; charging: boolean } | null;
    if (!b) return null;
    return { level: b.level, charging: b.charging };
  } catch {
    return null;
  }
}

export async function verifyMapBackground(): Promise<void> {
  const { startTask, completeTask, failTask, skipTask } = useBackgroundTasksStore.getState();
  startTask('map_verify', 'Verificando integridad del mapa...', 1);

  try {
    const meta = await getMapMeta();
    if (!meta?.installedAt) {
      appLogger.info('[map_verify] mapa no descargado — disponible desde Settings');
      skipTask('map_verify', 'not_downloaded');
      return;
    }

    const exists = await opfsFileExists(MAP_FILENAME);
    if (!exists) {
      appLogger.info('[map_verify] OPFS entry ausente — disponible desde Settings');
      skipTask('map_verify', 'opfs_missing');
      return;
    }

    const buf = await readOPFSFile(MAP_FILENAME);
    if (!buf) {
      appLogger.warn('[map_verify] no se pudo leer el archivo OPFS', {
        errorCode: 'ERR_OPFS_READ',
      });
      useAppLoaderStore.getState().setAvailability('degraded');
      failTask('map_verify', 'opfs_read_failed');
      return;
    }

    const hash = await sha256Hex(buf);
    if (hash !== meta.serverChecksum) {
      appLogger.warn('[map_verify] checksum mismatch — marcando degraded', {
        errorCode: 'ERR_CHECKSUM_MISMATCH',
        expected: meta.serverChecksum,
        actual: hash,
      });
      useAppLoaderStore.getState().setAvailability('degraded');
      failTask('map_verify', 'checksum_mismatch');
      return;
    }

    if (meta.clientChecksum !== hash) {
      await setMapMeta({ ...meta, clientChecksum: hash });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const metaRes = await fetch('/api/v1/maps/cuba.pmtiles.meta.json', {
        signal: controller.signal,
        cache: 'no-store',
      }).finally(() => clearTimeout(timeout));

      if (metaRes.ok) {
        const serverMeta = await metaRes.json() as { sha256?: string; version?: string };
        if (serverMeta.sha256 && serverMeta.sha256 !== meta.serverChecksum) {
          await setMapMeta({ ...meta, serverNewer: true, latestKnownVersion: serverMeta.version });
        }
      }
    } catch {
      // P4: servidor apagado, ignorar
    }

    completeTask('map_verify');
  } catch (err) {
    appLogger.warn('[map_verify] non-fatal', { error: err, errorCode: 'ERR_MAP_VERIFY' });
    failTask('map_verify', errorMessage(err));
  }
}

export async function precacheOfflineRoute(): Promise<void> {
  const { startTask, completeTask, failTask } = useBackgroundTasksStore.getState();
  startTask('precache_routes', 'Precacheando ruta offline...', 1);

  try {
    const res = await fetch(OFFLINE_ROUTE, {
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(PRECACHE_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    completeTask('precache_routes');
  } catch (err) {
    appLogger.warn('[precache_routes] non-fatal (servidor posiblemente apagado)', {
      error: err,
      errorCode: 'ERR_PRECACHE_ROUTES',
    });
    failTask('precache_routes', errorMessage(err));
  }
}

export async function prefetchImagesBackground(): Promise<void> {
  const { startTask, updateTask, completeTask, failTask } = useBackgroundTasksStore.getState();

  const total = await getCachedCount('products');
  if (total === 0) return;

  const { openDB: idbOpenDB } = await import('idb');
  const db = await idbOpenDB(DB_NAME, DB_VERSION);
  const all = (await db.getAll('products', undefined, IMAGE_PREFETCH_LIMIT)) as Array<{
    mainImage?: string | null;
  }>;
  const targets = all
    .filter((p): p is { mainImage: string } => Boolean(p.mainImage))
    .map((p) => ({ key: p.mainImage, path: `${PRODUCT_IMAGE_PATH_PREFIX}/${p.mainImage}` }));

  const jobTotal = targets.length;
  if (jobTotal === 0) return;

  startTask('image_prefetch', 'Precargando imágenes...', jobTotal);

  let done = 0;
  try {
    for (let i = 0; i < jobTotal; i += IMAGE_PREFETCH_CONCURRENCY) {
      if (typeof document !== 'undefined' && document.hidden) break;

      const battery = await getBatteryState();
      if (battery && battery.level < BATTERY_LOW_THRESHOLD && !battery.charging) break;

      const batch = targets.slice(i, i + IMAGE_PREFETCH_CONCURRENCY);
      await Promise.allSettled(
        batch.map(async ({ key, path }) => {
          if (await opfsFileExists(path)) {
            done++;
            updateTask('image_prefetch', done);
            return;
          }
          try {
            const res = await fetch(`/api/v1/images/${encodeURIComponent(key)}`);
            if (!res.ok) return;
            const buf = await res.arrayBuffer();
            await writeOPFSFile(path, buf);
          } catch {
            /* non-fatal — single image failure must not abort the batch */
          } finally {
            done++;
            updateTask('image_prefetch', done);
          }
        }),
      );
    }
    completeTask('image_prefetch');
  } catch (err) {
    appLogger.warn('[image_prefetch] non-fatal', { error: err, errorCode: 'ERR_IMAGE_PREFETCH' });
    failTask('image_prefetch', errorMessage(err));
  }
}

export async function populateGeoIndexBackground(): Promise<void> {
  const { startTask, completeTask, failTask, skipTask } = useBackgroundTasksStore.getState();
  startTask('populate_geo_index', 'Cargando índice geográfico...', 1);

  try {
    const { getDB: openDB } = await import('@/infrastructure/storage/db');
    const db = await openDB();
    const existing = await db.count('geoIndex');
    if (existing > 0) {
      skipTask('populate_geo_index', 'already_populated');
      return;
    }

    const { GeoRegionRepository } = await import('@/infrastructure/repositories/geo/GeoRegionRepository');
    const repo = new GeoRegionRepository();

    const provinces = await repo.getProvinces('CU');

    const tx = db.transaction('geoIndex', 'readwrite');
    const store = tx.objectStore('geoIndex');

    for (const province of provinces) {
      await store.put({
        id: `province_${province.id}`,
        type: 'province',
        name: province.name,
        normalizedName: province.name.toLowerCase(),
        aliases: [],
        parentIds: ['CU'],
        center: [province.longitude ?? 0, province.latitude ?? 0] as [number, number],
        bbox: [0, 0, 0, 0] as [number, number, number, number],
        countryCode: 'CU',
      });

      const municipalities = await repo.getMunicipalities(province.id);
      for (const muni of municipalities) {
        await store.put({
          id: `municipality_${muni.id}`,
          type: 'municipality',
          name: muni.name,
          normalizedName: muni.name.toLowerCase(),
          aliases: [],
          parentIds: [`province_${province.id}`, 'CU'],
          center: [muni.longitude ?? 0, muni.latitude ?? 0] as [number, number],
          bbox: [0, 0, 0, 0] as [number, number, number, number],
          countryCode: 'CU',
        });
      }
    }

    await tx.done;
    completeTask('populate_geo_index');
  } catch (err) {
    appLogger.warn('[populate_geo_index] non-fatal', {
      error: err,
      errorCode: 'ERR_GEOINDEX_LOAD_FAILED',
    });
    failTask('populate_geo_index', errorMessage(err));
  }
}

const BACKGROUND_TASK_RUNNERS: Array<{ id: BackgroundTaskId; run: () => Promise<void> }> = [
  { id: 'map_verify', run: verifyMapBackground },
  { id: 'precache_routes', run: precacheOfflineRoute },
  { id: 'image_prefetch', run: prefetchImagesBackground },
  { id: 'populate_geo_index', run: populateGeoIndexBackground },
];

export async function startBackgroundTasks(): Promise<void> {
  try {
    appLogger.info('[BackgroundTasks] iniciando tasks post-ready_partial');
    await useBackgroundTasksStore.getState().startAll(BACKGROUND_TASK_RUNNERS);
    appLogger.info('[BackgroundTasks] tasks finalizadas');
  } catch (err) {
    appLogger.warn('[BackgroundTasks] error global no fatal', {
      error: err,
      errorCode: 'ERR_BACKGROUND_TASKS',
    });
  }
}
