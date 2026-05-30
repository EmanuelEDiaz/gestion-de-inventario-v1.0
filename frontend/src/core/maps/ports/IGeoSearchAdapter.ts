import type { GeoEntry } from '@/core/maps/entities/map-location';

export interface IGeoSearchAdapter {
  load(config: { geoIndexUrl: string; countryCode: string }): Promise<void>;
  search(query: string, limit?: number, filters?: { province?: string; municipality?: string }): Promise<GeoEntry[]>;
  isLoaded(): boolean;
  getCountryCode(): string;
}
