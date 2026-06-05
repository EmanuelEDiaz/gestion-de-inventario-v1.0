'use client';

import { useEffect, useRef } from 'react';
import { getDB } from '@/infrastructure/storage/db';
import { useAppLoaderStore } from '@/core/loading/appLoaderStore';
import { GeoRegionRepository } from '@/infrastructure/repositories/geo/GeoRegionRepository';

const repo = new GeoRegionRepository();

export function useGeoIndexLoader(): void {
  const availability = useAppLoaderStore((s) => s.availability);
  const loadedRef = useRef(false);
  const retryRef = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (availability !== 'ready_partial') return;
    if (loadedRef.current) return;
    if (retryRef.current >= MAX_RETRIES) return;

    (async () => {
      try {
        const db = await getDB();
        const existing = await db.count('geoIndex');
        if (existing > 0) {
          loadedRef.current = true;
          return;
        }

        const provinces = await repo.getProvinces('CU');
        const geoIndexRecords: Array<{
          id: string; type: string; name: string; normalizedName: string;
          aliases: string[]; parentIds: string[]; center: [number, number];
          bbox: [number, number, number, number]; countryCode: string;
        }> = [];
        const tx = db.transaction('geoIndex', 'readwrite');

        for (const province of provinces) {
          geoIndexRecords.push({
            id: `province_${province.id}`,
            type: 'province',
            name: province.name,
            normalizedName: province.name.toLowerCase(),
            aliases: [],
            parentIds: ['CU'],
            center: [province.longitude ?? 0, province.latitude ?? 0],
            bbox: [0, 0, 0, 0],
            countryCode: 'CU',
          });

          const municipalities = await repo.getMunicipalities(province.id);
          for (const muni of municipalities) {
            geoIndexRecords.push({
              id: `municipality_${muni.id}`,
              type: 'municipality',
              name: muni.name,
              normalizedName: muni.name.toLowerCase(),
              aliases: [],
              parentIds: [`province_${province.id}`, 'CU'],
              center: [muni.longitude ?? 0, muni.latitude ?? 0],
              bbox: [0, 0, 0, 0],
              countryCode: 'CU',
            });
          }
        }

        for (const record of geoIndexRecords) {
          await tx.store.put(record as never);
        }

        await tx.done;
        loadedRef.current = true;
      } catch {
        retryRef.current++;
      }
    })();
  }, [availability]);
}
