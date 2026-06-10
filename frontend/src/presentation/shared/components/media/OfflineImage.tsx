'use client';

import { useImageCache } from '@/infrastructure/images/useImageCache';
import { cn } from '@/presentation/shared/lib/utils';
import { Skeleton } from '@/presentation/shared/components/data-display/Skeleton';
import { ImagePlus } from '@/presentation/shared/components/ui/icon-mapping';

interface OfflineImageProps {
  imageKey: string | null | undefined;
  alt: string;
  size?: 'thumbnail' | 'preview' | 'full';
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function OfflineImage({
  imageKey,
  alt,
  size = 'thumbnail',
  className,
  fallbackIcon,
}: OfflineImageProps) {
  const { src, loading, error, isFromCache } = useImageCache(imageKey, { size });

  if (loading) {
    return (
      <Skeleton
        className={cn('bg-gray-200', className)}
        aria-label="Cargando imagen…"
        aria-busy="true"
      />
    );
  }

  if (error || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className,
        )}
        role="img"
        aria-label={error ? 'Error al cargar imagen' : 'Imagen no disponible'}
      >
        {fallbackIcon ?? <ImagePlus className="h-8 w-8" />}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      loading={size === 'thumbnail' ? 'eager' : 'lazy'}
      data-cached={isFromCache ? 'true' : undefined}
    />
  );
}
