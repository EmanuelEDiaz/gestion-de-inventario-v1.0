'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MapLocation, GeoEntry, MapTileConfig } from '@/core/maps/entities/map-location';
import type { IGeoSearchAdapter } from '@/core/maps/ports/IGeoSearchAdapter';
import { CubaGeoSearchAdapter } from '@/infrastructure/maps/adapters/CubaGeoSearchAdapter';
import type { MapMarkerProps } from './OfflineMap';
import { OfflineMap } from './OfflineMap';
import { MapSkeleton } from './MapSkeleton';
import { MapError } from './MapError';
import { MapEmpty } from './MapEmpty';

const DEFAULT_TILES_CONFIG: MapTileConfig = {
  tilesUrl: '/tiles/cuba.pmtiles',
  geoIndexUrl: '/geo/geo-index-cuba.json',
  countryCode: 'CU',
  maxZoom: 16,
};

interface MapContainerProps {
  tilesConfig?: MapTileConfig;
  tilesConfigDefault?: Partial<MapTileConfig>;
  geoSearchAdapter?: IGeoSearchAdapter;
  center?: MapLocation;
  zoom?: number;
  markers?: MapMarkerProps[];
  searchEnabled?: boolean;
  controlsEnabled?: boolean;
  readonly?: boolean;
  onLocationSelect?: (location: MapLocation, geoEntry?: GeoEntry) => void;
  emptyMessage?: string;
  errorMessage?: string;
}

export function MapContainer({
  tilesConfig,
  tilesConfigDefault,
  geoSearchAdapter,
  center,
  zoom,
  markers,
  searchEnabled = true,
  controlsEnabled = true,
  readonly = false,
  onLocationSelect,
  emptyMessage,
  errorMessage,
}: MapContainerProps) {
  const config = { ...DEFAULT_TILES_CONFIG, ...tilesConfigDefault, ...tilesConfig };
  const [status, setStatus] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading');
  const [tilesAvailable, setTilesAvailable] = useState(false);
  const [geoAvailable, setGeoAvailable] = useState(false);
  const [adapter] = useState<IGeoSearchAdapter>(() => geoSearchAdapter ?? new CubaGeoSearchAdapter());

  const init = useCallback(async () => {
    setStatus('loading');
    let cancelled = false;

    try {
      await adapter.load({ geoIndexUrl: config.geoIndexUrl!, countryCode: config.countryCode! });
      if (!cancelled) setGeoAvailable(true);
    } catch {
      if (!cancelled) setGeoAvailable(false);
    }

    try {
      const cache = await caches.open('map-tiles-v1');
      const tileCached = await cache.match(config.tilesUrl!);
      if (tileCached?.ok) {
        if (!cancelled) setTilesAvailable(true);
      } else {
        const resp = await fetch(config.tilesUrl!, { method: 'HEAD' });
        if (!cancelled) setTilesAvailable(resp.ok);
      }
    } catch {
      if (!cancelled) setTilesAvailable(false);
    }

    if (!cancelled) {
      setStatus(!tilesAvailable && !geoAvailable ? 'empty' : 'ready');
    }

    return () => { cancelled = true; };
  }, [config.tilesUrl, config.geoIndexUrl, config.countryCode, adapter, geoAvailable, tilesAvailable]);

  useEffect(() => {
    init();
  }, [init]);

  if (status === 'loading') return <MapSkeleton />;
  if (status === 'error') return <MapError onRetry={init} message={errorMessage} />;
  if (status === 'empty') return <MapEmpty message={emptyMessage} />;

  return (
    <OfflineMap
      config={config}
      tilesAvailable={tilesAvailable}
      geoAvailable={geoAvailable}
      geoSearchAdapter={adapter}
      center={center}
      zoom={zoom}
      markers={markers}
      searchEnabled={searchEnabled}
      controlsEnabled={controlsEnabled}
      readonly={readonly}
      onLocationSelect={onLocationSelect}
    />
  );
}
