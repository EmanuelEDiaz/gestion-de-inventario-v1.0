import type { ITileManager, TileSetInfo } from '@/core/maps/ports/ITileManager';
import { getDB, setSyncMeta } from '@/infrastructure/storage/db';

type SyncMetaRecord = { key: string; value: unknown };

export class CubaTileManager implements ITileManager {
  async getInstalledTileSets(): Promise<TileSetInfo[]> {
    const db = await getDB();
    const meta = await db.getAll('syncMeta');
    return meta
      .filter((m): m is SyncMetaRecord =>
        typeof m.key === 'string' && m.key.startsWith('tileset_') && isTileSetInfo(m.value)
      )
      .map((m) => m.value as TileSetInfo);
  }

  async installTileSet(config: { tilesUrl: string; geoIndexUrl: string; countryCode: string }): Promise<void> {
    const cache = await caches.open('map-tiles-v1');
    await cache.add(config.tilesUrl);
    await cache.add(config.geoIndexUrl);
    await setSyncMeta(`tileset_${config.countryCode}`, {
      countryCode: config.countryCode,
      tilesUrl: config.tilesUrl,
      geoIndexUrl: config.geoIndexUrl,
      downloadedAt: Date.now(),
      zoomMax: 16,
      sizeBytes: 0,
    });
  }

  async removeTileSet(countryCode: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('syncMeta', 'readwrite');
    tx.objectStore('syncMeta').delete(`tileset_${countryCode}`);
    await tx.done;
  }

  async updateTileSet(countryCode: string): Promise<void> {
    const db = await getDB();
    const meta = await db.get('syncMeta', `tileset_${countryCode}`);
    if (meta && isTileSetInfo(meta.value)) {
      const config = meta.value;
      await this.installTileSet({ tilesUrl: config.tilesUrl, geoIndexUrl: config.geoIndexUrl ?? '', countryCode });
    }
  }

  async getEstimatedSize(config: { countryCode: string }): Promise<number> {
    const db = await getDB();
    const meta = await db.get('syncMeta', `tileset_${config.countryCode}`);
    if (meta && isTileSetInfo(meta.value)) {
      return meta.value.sizeBytes;
    }
    return 0;
  }
}

function isTileSetInfo(value: unknown): value is TileSetInfo {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.tilesUrl === 'string' && typeof v.countryCode === 'string';
}
