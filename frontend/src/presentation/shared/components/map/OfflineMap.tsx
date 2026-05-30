'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMapInstance } from 'leaflet';
import type { MapLocation, MapTileConfig, GeoEntry } from '@/core/maps/entities/map-location';
import type { IGeoSearchAdapter } from '@/core/maps/ports/IGeoSearchAdapter';
import { GeoSearchInput } from './GeoSearchInput';
import { MapControls } from './MapControls';
import 'leaflet/dist/leaflet.css';

const LeafletMap = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

export interface MapMarkerProps {
  position: MapLocation;
  label?: string;
}

interface OfflineMapProps {
  config: MapTileConfig;
  tilesAvailable: boolean;
  geoAvailable: boolean;
  geoSearchAdapter?: IGeoSearchAdapter;
  center?: MapLocation;
  zoom?: number;
  markers?: MapMarkerProps[];
  searchEnabled?: boolean;
  controlsEnabled?: boolean;
  readonly?: boolean;
  onLocationSelect?: (location: MapLocation, geoEntry?: GeoEntry) => void;
}

function MapClickHandler({ readonly, onLocationSelect }: { readonly?: boolean; onLocationSelect?: (loc: MapLocation) => void }) {
  useMapEvents({
    click(e) {
      if (!readonly && onLocationSelect) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function MapController({ onInstance }: { onInstance: (map: LeafletMapInstance) => void }) {
  const map = useMap();
  useEffect(() => {
    onInstance(map);
  }, [map, onInstance]);
  return null;
}

export function OfflineMap({
  config,
  tilesAvailable,
  geoAvailable,
  geoSearchAdapter,
  center: initialCenter,
  zoom: initialZoom,
  markers = [],
  searchEnabled = true,
  controlsEnabled = true,
  readonly = false,
  onLocationSelect,
}: OfflineMapProps) {
  const [mapInstance, setMapInstance] = useState<LeafletMapInstance | null>(null);
  const [center, setCenter] = useState<MapLocation>(initialCenter ?? { lat: 23.1136, lng: -82.3666 });
  const [zoom, setZoom] = useState(initialZoom ?? 8);

  const handleGeoSelect = (entry: GeoEntry) => {
    setCenter({ lat: entry.lat, lng: entry.lng });
    setZoom(15);
    if (onLocationSelect) {
      onLocationSelect({ lat: entry.lat, lng: entry.lng }, entry);
    }
  };

  return (
    <div id="map-container" className="relative w-full h-96 rounded-lg overflow-hidden border">
      {searchEnabled && geoAvailable && geoSearchAdapter && (
        <div className="absolute top-3 left-3 right-3 z-[1000]">
          <GeoSearchInput
            searchAdapter={geoSearchAdapter}
            onSelect={handleGeoSelect}
            placeholder="Buscar calle o lugar..."
          />
        </div>
      )}

      <LeafletMap
        center={[center.lat, center.lng]}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
      >
        {tilesAvailable ? (
          <TileLayer
            url={`/tiles/${config.countryCode.toLowerCase()}/{z}/{x}/{y}.pbf`}
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
        )}

        {markers.map((m, i) => (
          <Marker key={i} position={[m.position.lat, m.position.lng]} />
        ))}

        <MapClickHandler readonly={readonly} onLocationSelect={onLocationSelect} />
        <MapController onInstance={setMapInstance} />
      </LeafletMap>

      {controlsEnabled && <MapControls mapInstance={mapInstance} />}
    </div>
  );
}
