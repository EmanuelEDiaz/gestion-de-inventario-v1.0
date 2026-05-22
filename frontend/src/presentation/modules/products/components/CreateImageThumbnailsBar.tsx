'use client';

import type { ReactNode } from 'react';
import { ImagePlus } from '@/presentation/shared/components/ui/icon-mapping';

const INPUT_ID = 'create-product-images';

interface CreateImageThumbnailsBarProps {
  children: ReactNode;
  canAddMore: boolean;
}

export function CreateImageThumbnailsBar({ children, canAddMore }: CreateImageThumbnailsBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {children}
      {canAddMore && (
        <label
          htmlFor={INPUT_ID}
          title="Agregar más imágenes"
          className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50"
        >
          <ImagePlus className="h-5 w-5" />
        </label>
      )}
    </div>
  );
}
