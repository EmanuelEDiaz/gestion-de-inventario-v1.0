import type { IGeoSearchAdapter } from '@/core/maps/ports/IGeoSearchAdapter';
import type { GeoEntry } from '@/core/maps/entities/map-location';
import type { Index as FlexSearchIndex } from 'flexsearch';
import { getDB } from '@/infrastructure/storage/db';

function isGeoEntryArray(value: unknown): value is GeoEntry[] {
  return Array.isArray(value);
}

export class CubaGeoSearchAdapter implements IGeoSearchAdapter {
  private index: FlexSearchIndex | null = null;
  private entries: GeoEntry[] = [];
  private loaded = false;
  private countryCode = 'CU';

  async load(config: { geoIndexUrl: string; countryCode: string }): Promise<void> {
    if (this.loaded) return;
    this.countryCode = config.countryCode;
    const data = await this.loadGeoIndex(config.geoIndexUrl);
    const FlexSearch = await import('flexsearch');
    this.index = new FlexSearch.Index({ tokenize: 'forward' });
    data.forEach((entry, i) => this.index!.add(i, `${entry.name} ${entry.parentName ?? ''}`));
    this.entries = data;
    this.loaded = true;
  }

  private async loadGeoIndex(url: string): Promise<GeoEntry[]> {
    const db = await getDB();
    const idbCached = await db.get('syncMeta', `geo_index_${this.countryCode}`);
    if (idbCached && isGeoEntryArray(idbCached.value)) return idbCached.value;

    const cache = await caches.open('map-tiles-v1');
    const cachedResponse = await cache.match(url);
    if (cachedResponse?.ok) {
      const data = (await cachedResponse.json()) as GeoEntry[];
      await db.put('syncMeta', { key: `geo_index_${this.countryCode}`, value: { data } });
      return data;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Geo index no disponible: ${response.status}`);
    const data = (await response.json()) as GeoEntry[];
    await cache.put(url, new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }));
    await db.put('syncMeta', { key: `geo_index_${this.countryCode}`, value: { data } });
    return data;
  }

  async search(query: string, limit = 15, filters?: { province?: string; municipality?: string }): Promise<GeoEntry[]> {
    if (!this.index) return [];
    const ids = this.index.search(query, limit * 2) as number[];
    let results = ids.map(i => this.entries[i]);
    if (filters?.province) results = results.filter(e => e.parentName === filters.province || e.extra?.province === filters.province);
    if (filters?.municipality) results = results.filter(e => e.extra?.municipality === filters.municipality);
    return results.slice(0, limit);
  }

  isLoaded(): boolean { return this.loaded; }
  getCountryCode(): string { return this.countryCode; }
}
