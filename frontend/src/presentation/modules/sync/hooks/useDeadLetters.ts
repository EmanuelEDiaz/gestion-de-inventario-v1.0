'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDeadLetters, retryDeadLetter, discardDeadLetter, addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB } from '@/infrastructure/storage/db';
import type { DeadLetterEntry } from '@/infrastructure/storage/db';

export function useDeadLetters() {
  const [deadLetters, setDeadLetters] = useState<DeadLetterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const letters = await getDeadLetters();
      if (mountedRef.current) {
        setDeadLetters(letters);
        setLoading(false);
      }
    } catch {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();

    const interval = setInterval(async () => {
      try {
        const letters = await getDeadLetters();
        if (mountedRef.current) {
          setDeadLetters((prev) => {
            if (prev.length === 0 && letters.length === 0) return prev;
            if (JSON.stringify(prev) === JSON.stringify(letters)) return prev;
            return letters;
          });
        }
      } catch {
        // pool errors silently
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refresh]);

  const retry = useCallback(async (operationId: string) => {
    await retryDeadLetter(operationId);
    await refresh();
  }, [refresh]);

  const discard = useCallback(async (operationId: string) => {
    await discardDeadLetter(operationId);
    await refresh();
  }, [refresh]);

  const retryWithEdit = useCallback(async (operationId: string, newPayload: unknown) => {
    const db = await getDB();
    const deadEntry = await db.get('deadLetter', operationId);
    if (!deadEntry) return;
    await addToOutbox({
      operationId: deadEntry.operationId,
      entityType: deadEntry.entityType,
      entityId: deadEntry.entityId,
      action: deadEntry.action,
      payload: newPayload,
    });
    await db.delete('deadLetter', operationId);
    await refresh();
  }, [refresh]);

  return { deadLetters, loading, retry, discard, retryWithEdit };
}
