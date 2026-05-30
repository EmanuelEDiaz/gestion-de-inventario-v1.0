import type { GeoRegion } from '@/core/geo/entities/geo-region';

export interface IGeoRegionRepository {
  getProvinces(countryCode?: string): Promise<GeoRegion[]>;
  getMunicipalities(provinceId: string): Promise<GeoRegion[]>;
}
