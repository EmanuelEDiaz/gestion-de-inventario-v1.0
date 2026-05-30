import type { ITileManager, TileSetInfo } from '@/core/maps/ports/ITileManager';
import { getDB, setSyncMeta } from '@/infrastructure/storage/db';

export class CubaTileManager implements ITileManager {
  async getInstalledTileSets(): Promise<TileSetInfo[]> {
    const db = await getDB();
    const meta = await (db as any).getAll('syncMeta');
    return meta
      .filter((m: any) => m.key?.startsWith('tileset_'))
      .map((m: any) => m.value as TileSetInfo);
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
    const meta = await (db as any).get('syncMeta', `tileset_${countryCode}`);
    if (meta) {
      const config = meta.value;
      await this.installTileSet({ tilesUrl: config.tilesUrl, geoIndexUrl: config.geoIndexUrl, countryCode });
    }
  }

  async getEstimatedSize(config: { countryCode: string }): Promise<number> {
    const db = await getDB();
    const meta = await (db as any).get('syncMeta', `tileset_${config.countryCode}`);
    return meta?.value?.sizeBytes ?? 0;
  }
}
