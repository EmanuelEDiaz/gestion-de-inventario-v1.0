'use client';

import { useQuery } from '@tanstack/react-query';
import { GeoRegionRepository } from '@/infrastructure/repositories/geo/GeoRegionRepository';

const repo = new GeoRegionRepository();

export function useMunicipalities(provinceId: string | undefined) {
  return useQuery({
    queryKey: ['geo', 'municipalities', provinceId],
    queryFn: () => repo.getMunicipalities(provinceId!),
    enabled: !!provinceId,
  });
}
