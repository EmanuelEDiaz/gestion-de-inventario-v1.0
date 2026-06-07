'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { initializeMapLibre } from '@/infrastructure/maps/MapLibreInitializer';
import { openPMTilesFromOPFS } from '@/infrastructure/maps/protocols/OPFSTileSource';
import { getCubaMapStyle } from '@/infrastructure/maps/styles/cuba-map-style';
import { getMapMeta } from '@/infrastructure/maps/opfs-utils';
import { MapStatusOverlay } from './MapStatusOverlay';
import { Crosshair, ZoomIn, ZoomOut, Share2 } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';

type MapStatus = 'loading' | 'ready' | 'not_downloaded' | 'error' | 'no_permission';

interface MapViewerProps {
  mode: 'view' | 'select';
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  markers?: Array<{ id: string; lat: number; lng: number; label?: string; color?: string }>;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  height?: string;
  showLocate?: boolean;
  showZoomControls?: boolean;
  onError?: () => void;
}

export function MapViewer({
  mode,
  initialCenter,
  initialZoom,
  markers,
  onLocationSelect,
  height = 'h-96',
  showLocate = true,
  showZoomControls = true,
  onError,
}: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [status, setStatus] = useState<MapStatus>('loading');
  const [gpsWatching, setGpsWatching] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let map: maplibregl.Map;

    (async () => {
      try {
        initializeMapLibre();

        const meta = await getMapMeta();
        const opfsAvailable = meta?.installedAt ? await openPMTilesFromOPFS('cuba.pmtiles') : false;

        const style = opfsAvailable
          ? getCubaMapStyle('opfs')
          : getCubaMapStyle('server');

        const center = initialCenter ?? { lat: 21.5, lng: -79.5 };

        map = new maplibregl.Map({
          container: containerRef.current!,
          style,
          center: [center.lng, center.lat],
          zoom: initialZoom ?? 6,
          attributionControl: false,
        });

        mapRef.current = map;

        map.on('load', () => {
          setStatus(opfsAvailable ? 'ready' : 'not_downloaded');

          if (markers) {
            markers.forEach(m => {
              new maplibregl.Marker({ color: m.color ?? '#3b82f6' })
                .setLngLat([m.lng, m.lat])
                .setPopup(m.label ? new maplibregl.Popup().setText(m.label) : undefined)
                .addTo(map);
            });
          }
        });

        if (mode === 'select') {
          map.on('click', (e) => {
            onLocationSelect?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          });
        }

        map.on('error', () => {
          setStatus('error');
          onError?.();
        });
      } catch {
        setStatus('error');
        onError?.();
      }
    })();

    return () => {
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocate = useCallback(() => {
    if (!mapRef.current) return;
    if ('geolocation' in navigator) {
      setGpsWatching(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapRef.current?.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 14,
          });
          new maplibregl.Marker({ color: '#ef4444' })
            .setLngLat([pos.coords.longitude, pos.coords.latitude])
            .addTo(mapRef.current!);
          setGpsWatching(false);
        },
        () => {
          setStatus('no_permission');
          setGpsWatching(false);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, []);

  const handleShare = useCallback(() => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const url = `https://www.google.com/maps?q=${center.lat},${center.lng}`;
    if (navigator.share) {
      navigator.share({ title: 'Ubicación', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }, []);

  if (status === 'not_downloaded' || status === 'error' || status === 'no_permission') {
    return (
      <div className={`relative ${height}`} style={{ minHeight: '176px' }}>
        <MapStatusOverlay
          status={status === 'no_permission' ? 'no_permission' : status === 'error' ? 'error' : 'not_downloaded'}
          onDownload={() => { window.location.href = '/settings'; }}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${height}`} style={{ minHeight: '176px' }}>
      <div ref={containerRef} className="h-full w-full rounded-lg" />

      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {showZoomControls && (
          <>
            <TooltipWrapper content="Acercar">
              <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => mapRef.current?.zoomIn()}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
            <TooltipWrapper content="Alejar">
              <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => mapRef.current?.zoomOut()}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
          </>
        )}
        {showLocate && (
          <TooltipWrapper content="Mi ubicación">
            <Button variant="secondary" size="icon" className="h-9 w-9" onClick={handleLocate} disabled={gpsWatching}>
              <Crosshair className="h-4 w-4" />
            </Button>
          </TooltipWrapper>
        )}
        <TooltipWrapper content="Compartir ubicación">
          <Button variant="secondary" size="icon" className="h-9 w-9" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </TooltipWrapper>
      </div>
    </div>
  );
}
