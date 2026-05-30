import { apiClient } from '@/infrastructure/api/client';
import type { IGeoRegionRepository } from '@/core/geo/ports/IGeoRegionRepository';
import type { GeoRegion } from '@/core/geo/entities/geo-region';

export class GeoRegionRepository implements IGeoRegionRepository {
  private readonly basePath = '/api/v1/geo';

  async getProvinces(countryCode = 'CU'): Promise<GeoRegion[]> {
    const { data } = await apiClient.get<GeoRegion[]>(`${this.basePath}/provinces`, {
      params: { countryCode }
    });
    return data;
  }

  async getMunicipalities(provinceId: string): Promise<GeoRegion[]> {
    const { data } = await apiClient.get<GeoRegion[]>(`${this.basePath}/municipalities/${provinceId}`);
    return data;
  }
}
