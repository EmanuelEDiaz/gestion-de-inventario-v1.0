'use client';

import type { ProductImage } from '@/core/product/entities/product-image';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { getMediaUrl } from '@/presentation/shared/lib/utils';

interface ImageThumbnailProps {
  image: ProductImage;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export function ImageThumbnail({ image, index, isActive, onClick }: ImageThumbnailProps) {
  return (
    <TooltipWrapper content={`Ir a imagen ${index + 1}`}>
      <div
        onClick={onClick}
        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-gray-100 transition-all duration-300 hover:-translate-y-0.5 ${
          isActive ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-slate-200'
        }`}
      >
        <img src={getMediaUrl(image.filePath)} alt="" className="h-full w-full object-cover" />
        {image.isPrimary && (
          <span className="absolute left-1 top-1 rounded bg-amber-300 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950">
            P
          </span>
        )}
      </div>
    </TooltipWrapper>
  );
}
