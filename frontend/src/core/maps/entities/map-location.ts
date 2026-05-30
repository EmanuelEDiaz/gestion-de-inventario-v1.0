export interface MapLocation {
  lat: number;
  lng: number;
  zoom?: number;
}

export interface GeoEntry {
  id: string;
  name: string;
  type: 'street' | 'place' | 'poi' | 'municipality' | 'province';
  countryCode: string;
  parentName?: string;
  lat: number;
  lng: number;
  extra?: Record<string, string>;
}

export interface MapTileConfig {
  tilesUrl: string;
  geoIndexUrl: string;
  countryCode: string;
  maxZoom: number;
}
