import { useState, useEffect } from 'react';
import { getDB } from '@/infrastructure/storage/db';

export interface ProvinceItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface UseProvincesReturn {
  provinces: ProvinceItem[];
  loading: boolean;
}

export function useProvinces(): UseProvincesReturn {
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const db = await getDB();
        const records = await db.getAllFromIndex('geoIndex', 'by-type', 'province');
        if (cancelled) return;
        setProvinces(
          records.map((r) => ({
            id: r.id,
            name: r.name,
            lat: r.center?.[1] ?? 0,
            lng: r.center?.[0] ?? 0,
          }))
        );
      } catch {
        if (!cancelled) setProvinces([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { provinces, loading };
}
