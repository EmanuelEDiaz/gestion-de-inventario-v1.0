'use client';

import type { ProductImage } from '@/core/product/entities/product-image';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Star, Trash2, ChevronLeft, ChevronRight } from '@/presentation/shared/components/ui/icon-mapping';
import { getMediaUrl } from '@/presentation/shared/lib/utils';

interface ActiveImageDisplayProps {
  activeImage: ProductImage;
  safeActiveIndex: number;
  isPrimary: boolean;
  imagesLength: number;
  editable: boolean;
  isBusy: boolean;
  onLightboxOpen: (index: number) => void;
  onSetPrimary: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  goNext: () => void;
  goPrev: () => void;
}

export function ActiveImageDisplay({
  activeImage, safeActiveIndex, isPrimary, imagesLength,
  editable, isBusy,
  onLightboxOpen, onSetPrimary, onDelete, goNext, goPrev,
}: ActiveImageDisplayProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      <TooltipWrapper content="Haz click para abrir vista ampliada de la imagen">
        <div
          onClick={() => onLightboxOpen(safeActiveIndex)}
          className="relative aspect-video cursor-zoom-in"
        >
          <img
            src={getMediaUrl(activeImage.filePath)}
            alt={activeImage.originalFilename || 'Imagen del producto'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
          {isPrimary && (
            <span className="absolute left-3 top-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-amber-950">
              Imagen principal
            </span>
          )}
        </div>
      </TooltipWrapper>

      {imagesLength > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            title="Ver imagen anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            title="Ver siguiente imagen"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {editable && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          {!isPrimary && (
            <button
              type="button"
              title="Definir como imagen principal"
              disabled={isBusy}
              onClick={() => onSetPrimary(activeImage.id)}
              className="rounded-full bg-white/95 p-2 text-amber-600 shadow transition hover:bg-white disabled:opacity-50"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            title="Eliminar imagen actual"
            disabled={isBusy}
            onClick={() => onDelete(activeImage.id)}
            className="rounded-full bg-white/95 p-2 text-danger shadow transition hover:bg-white disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1 text-xs text-white">
        {safeActiveIndex + 1} / {imagesLength}
      </div>
    </div>
  );
}
