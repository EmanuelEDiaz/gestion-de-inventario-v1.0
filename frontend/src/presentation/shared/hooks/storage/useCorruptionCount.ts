'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDB } from '@/infrastructure/storage/db';

export function useCorruptionCount(refreshTrigger?: number): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const db = await getDB();
      const tx = db.transaction('corruptionQueue', 'readonly');
      const index = tx.store.index('by-status');
      const pending = await index.getAll('pending');
      setCount(pending.length);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshTrigger]);

  return count;
}
