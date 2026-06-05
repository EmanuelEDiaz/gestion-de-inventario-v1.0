'use client';

import { useState, useCallback, useRef } from 'react';

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface UseGeolocationReturn {
  coords: GeoPosition | null;
  loading: boolean;
  error: string | null;
  startWatching: () => void;
  stopWatching: () => void;
  getCurrentPosition: () => Promise<GeoPosition | null>;
}

export function useGeolocation(): UseGeolocationReturn {
  const [coords, setCoords] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setCoords({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    });
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(err.message);
    setLoading(false);
  }, []);

  const startWatching = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocalización no disponible');
      return;
    }
    setLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  }, [handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLoading(false);
  }, []);

  const getCurrentPosition = useCallback((): Promise<GeoPosition | null> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setError('Geolocalización no disponible');
        resolve(null);
        return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result: GeoPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          setCoords(result);
          setError(null);
          setLoading(false);
          resolve(result);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }, []);

  return { coords, loading, error, startWatching, stopWatching, getCurrentPosition };
}
