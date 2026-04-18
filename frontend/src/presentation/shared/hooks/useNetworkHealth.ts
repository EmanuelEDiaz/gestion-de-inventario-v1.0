'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type BackendStatus = 'connected' | 'disconnected' | 'checking';

const HEALTH_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/actuator/health`
  : 'http://localhost:8080/actuator/health';

const PING_INTERVAL_ONLINE = 15_000;
const PING_INTERVAL_OFFLINE = 5_000;
const PING_TIMEOUT = 4_000;

export function useNetworkHealth() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      if (mountedRef.current) setBackendStatus('disconnected');
      return false;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await fetch(HEALTH_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(PING_TIMEOUT),
        ]),
      });
      // Any HTTP response (even 500) means backend is reachable
      if (mountedRef.current) setBackendStatus('connected');
      return true;
    } catch {
      // Network error or timeout — backend truly unreachable
      if (mountedRef.current) setBackendStatus('disconnected');
      return false;
    }
  }, []);

  const startPolling = useCallback((interval: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(checkHealth, interval);
  }, [checkHealth]);

  useEffect(() => {
    mountedRef.current = true;

    checkHealth().then((ok) => {
      startPolling(ok ? PING_INTERVAL_ONLINE : PING_INTERVAL_OFFLINE);
    });

    const onOnline = () => {
      checkHealth().then((ok) => {
        startPolling(ok ? PING_INTERVAL_ONLINE : PING_INTERVAL_OFFLINE);
      });
    };
    const onOffline = () => {
      setBackendStatus('disconnected');
      startPolling(PING_INTERVAL_OFFLINE);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      abortRef.current?.abort();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [checkHealth, startPolling]);

  return { backendStatus, checkHealth };
}

/** One-shot check (no hook, for login page pre-submit) */
export async function checkBackendHealth(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    await fetch(HEALTH_URL, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(PING_TIMEOUT),
    });
    // Any HTTP response = backend reachable
    return true;
  } catch {
    return false;
  }
}
