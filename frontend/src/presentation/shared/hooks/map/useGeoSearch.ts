import { useState, useEffect, useRef } from 'react';
import { getDB } from '@/infrastructure/storage/db';

export interface GeoSearchResult {
  id: string;
  name: string;
  type: 'province' | 'municipality' | 'city';
  lat: number;
  lng: number;
}

interface UseGeoSearchReturn {
  results: GeoSearchResult[];
  loading: boolean;
}

interface GeoIndexRecord {
  id: string;
  type: string;
  name: string;
  normalizedName: string;
  parentIds: string[];
  center?: [number, number];
  countryCode?: string;
}

export function useGeoSearch(query: string): UseGeoSearchReturn {
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const db = await getDB();
        const normalized = query.toLowerCase();
        const all = await db.getAll('geoIndex') as GeoIndexRecord[];
        const filtered = all
          .filter((g) => g.name?.toLowerCase().includes(normalized))
          .slice(0, 5)
          .map((g) => ({
            id: g.id,
            name: g.name,
            type: (g.type === 'province' || g.type === 'municipality' ? g.type : 'city') as 'province' | 'municipality' | 'city',
            lat: g.center?.[1] ?? 0,
            lng: g.center?.[0] ?? 0,
          }));
        setResults(filtered);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return { results, loading };
}
