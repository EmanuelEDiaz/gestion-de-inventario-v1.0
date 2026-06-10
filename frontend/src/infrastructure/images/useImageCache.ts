'use client';

import { useState, useEffect, useRef } from 'react';
import { getDB } from '@/infrastructure/storage/db';
import { API_BASE_URL } from '@/presentation/shared/lib/utils';
import { writeOPFSFile, readOPFSFile } from '@/infrastructure/maps/opfs-utils';
import { appLogger } from '@/infrastructure/logging/appLogger';
import { extFromContentType, computeChecksum } from '@/infrastructure/images/opfs-image-utils';

const IMAGE_PATH_REGEX = /^\/api\/v1\/(products|suppliers|customers)\/([^/]+)\/images\/(\d+)$/;

export interface UseImageCacheOptions {
  size?: 'thumbnail' | 'preview' | 'full';
}

export interface UseImageCacheReturn {
  src: string | null;
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
}

export function useImageCache(
  imageKey: string | null | undefined,
  options?: UseImageCacheOptions,
): UseImageCacheReturn {
  const size = options?.size ?? 'thumbnail';
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!imageKey) {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      setSrc(null);
      setLoading(false);
      setError(null);
      setIsFromCache(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const match = imageKey.match(IMAGE_PATH_REGEX);
        if (!match) {
          throw new Error(`Formato de ruta de imagen inválido: ${imageKey}`);
        }

        const entityType = match[1];
        const entityId = match[2];
        const imageId = match[3];

        const db = await getDB();

        const entries = await db.getAllFromIndex('imageIndex', 'by-entity', [entityType, entityId]);
        const cachedEntry = entries.find(e => e.imageId === imageId && e.size === size);

        if (cachedEntry) {
          const buffer = await readOPFSFile(cachedEntry.opfsPath);
          if (buffer && !cancelled) {
            const blob = new Blob([buffer], { type: cachedEntry.contentType });
            const objectUrl = URL.createObjectURL(blob);
            if (urlRef.current) URL.revokeObjectURL(urlRef.current);
            urlRef.current = objectUrl;
            setSrc(objectUrl);
            setIsFromCache(true);
            setLoading(false);
            return;
          }
        }

        if (!navigator.onLine) {
          if (!cancelled) {
            setSrc(null);
            setIsFromCache(false);
            setLoading(false);
          }
          return;
        }

        const response = await fetch(`${API_BASE_URL}${imageKey}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        if (cancelled) {
          return;
        }

        const contentType = blob.type || 'image/jpeg';
        const ext = extFromContentType(contentType);
        const opfsPath = `images/${entityType}/${entityId}/${imageId}_${size}.${ext}`;

        const arrayBuffer = await blob.arrayBuffer();

        await writeOPFSFile(opfsPath, arrayBuffer);

        const checksum = await computeChecksum(arrayBuffer);
        const now = Date.now();

        await db.put('imageIndex', {
          key: `${entityType}/${entityId}/${imageId}_${size}`,
          entityType,
          entityId,
          imageId,
          size,
          opfsPath,
          contentType,
          sizeBytes: blob.size,
          cachedAt: now,
          lastAccessedAt: now,
          checksum,
        });

        if (cancelled) return;

        const objectUrl = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = objectUrl;
        setSrc(objectUrl);
        setIsFromCache(false);
        setLoading(false);

        appLogger.info(`Imagen cacheada en OPFS: ${opfsPath}`);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Error desconocido al cargar imagen';
        appLogger.error('Error al cargar imagen', err instanceof Error ? err : new Error(String(err)));
        setError(msg);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageKey, size]);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  return { src, loading, error, isFromCache };
}
