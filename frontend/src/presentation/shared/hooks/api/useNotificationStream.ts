import { useEffect, useRef } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { INotification } from '@/core/notification/entities/notification';

interface PageData {
  content: INotification[];
  totalElements: number;
}

interface UseNotificationStreamOptions {
  typeKey: readonly string[];
  infiniteKey: readonly unknown[];
  enableSSE?: boolean;
  enableBackgroundSync?: boolean;
  refetchInterval?: number;
  sseFilter?: (notification: INotification) => boolean;
  refetch: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const RETRY_DELAY = 5000;

async function refreshToken(): Promise<string | null> {
  try {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return null;
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function runSSEStream(
  onNotification: (raw: string) => void,
  signal: AbortSignal,
): Promise<void> {
   
  while (!signal.aborted) {
    const token = localStorage.getItem('access_token');
    try {
      const headers: Record<string, string> = {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch('/api/v1/notifications/stream', {
        headers,
        signal,
        credentials: 'include',
      });

      if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken && newToken !== token) continue;
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        continue;
      }

      if (!response.ok) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        continue;
      }

      const reader = response.body?.getReader();
      if (!reader) continue;

      const decoder = new TextDecoder();
      let buffer = '';

       
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data) onNotification(data);
          }
        }
      }
    } catch {
      if (signal.aborted) return;
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }
  }
}

export function useNotificationStream(options: UseNotificationStreamOptions): void {
  const {
    typeKey, infiniteKey, enableSSE = true,
    enableBackgroundSync = true, refetchInterval = 30000,
    sseFilter, refetch,
  } = options;

  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const sseFilterRef = useRef(sseFilter);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    sseFilterRef.current = sseFilter;
  }, [sseFilter]);

  useEffect(() => {
    if (!enableSSE) return;

    const controller = new AbortController();
    abortRef.current = controller;

    runSSEStream((raw) => {
      try {
        const notification = JSON.parse(raw) as INotification;
        if (sseFilterRef.current && !sseFilterRef.current(notification)) return;

        queryClient.invalidateQueries({ queryKey: typeKey });

        queryClient.setQueryData<InfiniteData<PageData>>(infiniteKey, (oldData) => {
          if (!oldData?.pages?.length) return oldData;
          return {
            ...oldData,
            pages: [
              { ...oldData.pages[0], content: [notification, ...oldData.pages[0].content], totalElements: oldData.pages[0].totalElements + 1 },
              ...oldData.pages.slice(1),
            ],
          };
        });
      } catch {
        // parse error — skip
      }
    }, controller.signal);

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [enableSSE, queryClient, typeKey, infiniteKey]);

  useEffect(() => {
    if (!enableSSE && refetchInterval > 0) {
      pollRef.current = setInterval(() => refetch(), refetchInterval);
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [enableSSE, refetchInterval, refetch]);

  useEffect(() => {
    if (!enableBackgroundSync) return;
    const handleVisibilityChange = () => {
      if (!document.hidden) queryClient.invalidateQueries({ queryKey: typeKey });
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enableBackgroundSync, queryClient, typeKey]);
}
