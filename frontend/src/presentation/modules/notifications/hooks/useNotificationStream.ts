'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Se suscribe al SSE de notificaciones e invalida el contador de no leídas
 * cuando llega un nuevo evento. Sin Zustand: confía en React Query como fuente de verdad.
 */
export function useNotificationStream() {
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/v1/notifications/stream', { withCredentials: true });
    esRef.current = es;

    es.onmessage = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    es.addEventListener('notification', () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    });

    es.onerror = () => {
      // Reconexión automática del navegador — no acción requerida
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [qc]);
}
