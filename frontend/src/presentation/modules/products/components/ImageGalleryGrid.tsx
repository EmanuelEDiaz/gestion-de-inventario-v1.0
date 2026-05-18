'use client';

import type { ProductImage } from '@/core/entities/product-image';
import { Image as ImageIcon } from 'lucide-react';
import { ActiveImageDisplay } from './ActiveImageDisplay';

interface ImageGalleryGridProps {
  activeImage: ProductImage | null;
  safeActiveIndex: number;
  isPrimary: boolean;
  imagesLength: number;
  editable: boolean;
  isBusy: boolean;
  fileInputId: string;
  onLightboxOpen: (index: number) => void;
  onSetPrimary: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  goNext: () => void;
  goPrev: () => void;
}

export function ImageGalleryGrid({
  activeImage, safeActiveIndex, isPrimary, imagesLength,
  editable, isBusy, fileInputId,
  onLightboxOpen, onSetPrimary, onDelete, goNext, goPrev,
}: ImageGalleryGridProps) {
  if (!activeImage) {
    return (
      <label
        htmlFor={fileInputId}
        className="flex aspect-video cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-50"
      >
        <div className="text-center text-slate-500">
          <ImageIcon className="mx-auto mb-2 h-12 w-12" />
          <p className="text-sm">Sin imagen principal</p>
        </div>
      </label>
    );
  }

  return (
    <ActiveImageDisplay
      activeImage={activeImage}
      safeActiveIndex={safeActiveIndex}
      isPrimary={isPrimary}
      imagesLength={imagesLength}
      editable={editable}
      isBusy={isBusy}
      onLightboxOpen={onLightboxOpen}
      onSetPrimary={onSetPrimary}
      onDelete={onDelete}
      goNext={goNext}
      goPrev={goPrev}
    />
  );
}
