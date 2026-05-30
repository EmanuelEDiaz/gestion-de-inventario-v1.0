'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/presentation/shared/lib/utils';
import { useNetworkStore, type NetworkMode } from '@/infrastructure/storage/networkStore';

export type BackendStatus = 'connected' | 'disconnected' | 'checking';

const LOCAL_HEALTH_URL = `${API_BASE_URL}/actuator/health`;

const PING_INTERVAL_ONLINE = 60_000;
const PING_INTERVAL_OFFLINE = 30_000;
const PING_TIMEOUT = 2_000;

const MAX_CONSECUTIVE_ERRORS = 3;
const BACKOFF_MULTIPLIER = 4;

export function useNetworkHealth(onReconnect?: () => void) {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const errorsRef = useRef(0);
  const prevBackendRef = useRef<BackendStatus>('checking');
  const onReconnectRef = useRef(onReconnect);

  const startPolling = useCallback((interval: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(LOCAL_HEALTH_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(PING_TIMEOUT),
        ]),
      })
        .then(() => {
          if (!mountedRef.current) return;
          setBackendStatus('connected');
          errorsRef.current = 0;
        })
        .catch(() => {
          if (!mountedRef.current) return;
          setBackendStatus('disconnected');
          errorsRef.current += 1;
        });
    }, interval);
  }, []);

  const scheduleNext = useCallback((wasOnline: boolean) => {
    let base: number;
    if (!wasOnline) {
      base = PING_INTERVAL_OFFLINE;
    } else {
      base = PING_INTERVAL_ONLINE;
    }

    if (errorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
      base *= BACKOFF_MULTIPLIER;
    }

    startPolling(base);
  }, [startPolling]);

  useEffect(() => {
    mountedRef.current = true;

    const doCheck = () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(LOCAL_HEALTH_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(PING_TIMEOUT),
        ]),
      })
        .then(() => {
          if (!mountedRef.current) return;
          setBackendStatus('connected');
          errorsRef.current = 0;
        })
        .catch(() => {
          if (!mountedRef.current) return;
          setBackendStatus('disconnected');
          errorsRef.current += 1;
        });
    };

    const onOnline = () => {
      doCheck();
      scheduleNext(true);
    };

    const onOffline = () => {
      setBackendStatus('disconnected');
      errorsRef.current += 1;
      scheduleNext(false);
    };

    doCheck();
    scheduleNext(true);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      abortRef.current?.abort();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [scheduleNext]);

  useEffect(() => {
    const mode: NetworkMode = !navigator.onLine ? 'offline'
      : backendStatus === 'connected' ? 'online-direct'
      : 'online-degraded';
    useNetworkStore.getState().setMode(mode);
  }, [backendStatus]);

  useEffect(() => {
    if (prevBackendRef.current === 'disconnected' && backendStatus === 'connected') {
      onReconnectRef.current?.();
    }
    prevBackendRef.current = backendStatus;
  }, [backendStatus]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  return { backendStatus, checkHealth: () => fetch(LOCAL_HEALTH_URL, { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(PING_TIMEOUT) }).then(() => true).catch(() => false) };
}

/** One-shot check (no hook, for login page pre-submit) */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    await fetch(LOCAL_HEALTH_URL, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(PING_TIMEOUT),
    });
    return true;
  } catch {
    return false;
  }
}
