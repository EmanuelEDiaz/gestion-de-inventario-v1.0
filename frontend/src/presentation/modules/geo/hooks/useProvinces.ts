'use client';

import { useQuery } from '@tanstack/react-query';
import { GeoRegionRepository } from '@/infrastructure/repositories/geo/GeoRegionRepository';

const repo = new GeoRegionRepository();

export function useProvinces(countryCode = 'CU') {
  return useQuery({
    queryKey: ['geo', 'provinces', countryCode],
    queryFn: () => repo.getProvinces(countryCode),
  });
}
