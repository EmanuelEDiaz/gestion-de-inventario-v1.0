'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

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
  onEvent: () => void,
  signal: AbortSignal,
): Promise<void> {
  const getToken = () => localStorage.getItem('access_token');

  // eslint-disable-next-line no-constant-condition
  while (!signal.aborted) {
    const token = getToken();
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
        if (newToken && newToken !== token) {
          continue; // retry with new token
        }
        // Token refresh failed — wait and retry
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

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data) onEvent();
          }
        }
      }
    } catch {
      if (signal.aborted) return;
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }
  }
}

export function useNotificationStream() {
  const qc = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    runSSEStream(
      () => qc.invalidateQueries({ queryKey: ['notifications'] }),
      controller.signal,
    );

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [qc]);
}
