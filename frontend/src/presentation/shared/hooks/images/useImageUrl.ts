'use client';

import { useState, useEffect, useRef } from 'react';
import { resolveImageUrl } from '@/infrastructure/images/ImageResolver';

export function useImageUrl(relativePath: string | null): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!relativePath) {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      setObjectUrl(null);
      return;
    }

    let cancelled = false;

    resolveImageUrl(relativePath).then((url) => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      if (!cancelled) {
        setObjectUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [relativePath]);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  return objectUrl;
}
