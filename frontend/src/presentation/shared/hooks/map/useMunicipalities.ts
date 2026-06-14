import { useState, useEffect } from 'react';
import { getDB } from '@/infrastructure/storage/db';

export interface MunicipalityItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface UseMunicipalitiesReturn {
  municipalities: MunicipalityItem[];
  loading: boolean;
}

export function useMunicipalities(provinceId: string | null): UseMunicipalitiesReturn {
  const [municipalities, setMunicipalities] = useState<MunicipalityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (!provinceId) {
      setMunicipalities([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const db = await getDB();
        const records = await db.getAllFromIndex('geoIndex', 'by-parent', provinceId);
        if (cancelled) return;
        setMunicipalities(
          records
            .filter((r) => r.type === 'municipality')
            .map((r) => ({
              id: r.id,
              name: r.name,
              lat: r.center?.[1] ?? 0,
              lng: r.center?.[0] ?? 0,
            }))
        );
      } catch {
        if (!cancelled) setMunicipalities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [provinceId]);

  return { municipalities, loading };
}
