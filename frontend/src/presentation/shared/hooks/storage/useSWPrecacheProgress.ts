'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface SWPrecacheProgress {
  completed: number;
  total: number;
  percent: number;
  done: boolean;
}

export function useSWPrecacheProgress(): SWPrecacheProgress & { triggerStart: () => void } {
  const [progress, setProgress] = useState<SWPrecacheProgress>({
    completed: 0,
    total: 0,
    percent: 0,
    done: true,
  });
  const doneRef = useRef(false);
  const startedRef = useRef(false);

  const triggerStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    doneRef.current = false;

    setProgress({ completed: 0, total: 0, percent: 0, done: false });

    if (!('serviceWorker' in navigator)) {
      doneRef.current = true;
      setProgress((prev) => ({ ...prev, done: true }));
      return;
    }

    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: 'START_PRECACHING' });
    });
  }, []);

  useEffect(() => {
    if (doneRef.current) return;
    if (!('serviceWorker' in navigator)) {
      doneRef.current = true;
      return;
    }

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PRECACHE_PROGRESS') {
        const { completed, total } = event.data;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        const done = total === 0 || completed >= total;

        setProgress({ completed, total, percent, done });

        if (done) {
          doneRef.current = true;
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handler);
    };
  }, []);

  return { ...progress, triggerStart };
}
