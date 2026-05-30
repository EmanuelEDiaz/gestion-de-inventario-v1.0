import { setSyncMeta } from '@/infrastructure/storage/db';

export interface RegionDownload {
  regionCode: string;
  label: string;
  tilesUrl: string;
  geoIndexUrl: string;
  sizeMB: number;
}

export const AVAILABLE_REGIONS: RegionDownload[] = [
  { regionCode: 'CU', label: 'Cuba', tilesUrl: '/tiles/cuba.pmtiles', geoIndexUrl: '/geo/geo-index-cuba.json', sizeMB: 100 },
];

export async function downloadRegion(region: RegionDownload): Promise<void> {
  const sizeMB = region.sizeMB;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  const speedHint = conn?.downlink != null
    ? `Velocidad estimada: ${((conn.downlink / 8) * sizeMB).toFixed(0)}s`
    : '';
  const confirmed = window.confirm(
    `Descargar mapa offline de ${region.label} (${sizeMB} MB)?\n` +
    `Se almacenará localmente y estará disponible sin conexión.\n` +
    speedHint
  );
  if (!confirmed) return;

  const cache = await caches.open('map-tiles-v1');
  await Promise.all([
    cache.add(region.tilesUrl),
    cache.add(region.geoIndexUrl),
  ]);
  await setSyncMeta(`tileset_${region.regionCode}`, {
    countryCode: region.regionCode,
    tilesUrl: region.tilesUrl,
    geoIndexUrl: region.geoIndexUrl,
    downloadedAt: Date.now(),
    zoomMax: 16,
    sizeBytes: sizeMB * 1024 * 1024,
  });
}
