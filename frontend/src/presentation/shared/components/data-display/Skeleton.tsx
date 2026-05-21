'use client';

import { cn } from '@/presentation/shared/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      aria-hidden="true"
    />
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
  itemClassName?: string;
}

/** Renders `count` skeleton rows — useful for lists while loading */
export function SkeletonList({ count = 4, className, itemClassName }: SkeletonListProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-label="Cargando…" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('flex items-start gap-3 p-3', itemClassName)}>
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
