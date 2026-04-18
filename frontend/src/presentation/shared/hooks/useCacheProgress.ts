'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isPersistenceReady, getDB } from '@/infrastructure/storage/db';

export interface CacheModule {
  name: string;
  store: 'products' | 'syncMeta';
  loaded: boolean;
  count: number;
}

const MODULE_DEFS: { name: string; store: 'products' | 'syncMeta' }[] = [
  { name: 'Productos', store: 'products' },
];

const CHECK_INTERVAL = 3_000;
const MAX_CHECKS = 200; // Stop polling after ~10 minutes to prevent infinite loops

export function useCacheProgress() {
  const [modules, setModules] = useState<CacheModule[]>(
    MODULE_DEFS.map((m) => ({ ...m, loaded: false, count: 0 })),
  );
  const [overallPercent, setOverallPercent] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const checksRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkStores = useCallback(async () => {
    if (!isPersistenceReady()) return;

    checksRef.current++;
    // Safety: stop polling after MAX_CHECKS to avoid infinite loop
    if (checksRef.current > MAX_CHECKS) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    try {
      const db = await getDB();
      const updated: CacheModule[] = [];

      for (const mod of MODULE_DEFS) {
        const count = await db.count(mod.store);
        // Store is "loaded" once we can read it — even if empty (fresh system)
        updated.push({ ...mod, loaded: true, count });
      }

      setModules(updated);

      // Calculate progress: base 30% for app shell (always loaded),
      // remaining 70% distributed across data modules
      const APP_SHELL_WEIGHT = 30;
      const DATA_WEIGHT = 70;
      const loadedCount = updated.filter((m) => m.loaded).length;
      const dataPercent = MODULE_DEFS.length > 0
        ? (loadedCount / MODULE_DEFS.length) * DATA_WEIGHT
        : DATA_WEIGHT;
      const total = Math.round(APP_SHELL_WEIGHT + dataPercent);

      setOverallPercent(total);
      const allDone = total >= 100;
      setIsComplete(allDone);

      // Stop polling once everything is loaded
      if (allDone && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch {
      // DB not ready yet — ignore
    }
  }, []);

  useEffect(() => {
    checksRef.current = 0;
    checkStores();
    intervalRef.current = setInterval(checkStores, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkStores]);

  return { modules, overallPercent, isComplete };
}
