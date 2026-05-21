'use client';

import type { ProductImage } from '@/core/product/entities/product-image';
import { ImageThumbnail } from './ImageThumbnail';
import { ImageUploadButton } from './ImageUploadButton';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Plus } from 'lucide-react';

interface ImageThumbnailsBarProps {
  images: ProductImage[];
  safeActiveIndex: number;
  canAdd: boolean;
  editable: boolean;
  maxImages: number;
  onThumbnailClick: (index: number) => void;
  onUploadClick: () => void;
}

export function ImageThumbnailsBar({
  images,
  safeActiveIndex,
  canAdd,
  editable,
  maxImages,
  onThumbnailClick,
  onUploadClick,
}: ImageThumbnailsBarProps) {
  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((img, idx) => (
          <ImageThumbnail
            key={img.id}
            image={img}
            index={idx}
            isActive={safeActiveIndex === idx}
            onClick={() => onThumbnailClick(idx)}
          />
        ))}
        {canAdd && editable && <ImageUploadButton onClick={onUploadClick} />}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{images.length}/{maxImages} imágenes</span>
        {canAdd && editable && (
          <Button size="sm" onClick={onUploadClick} title="Agregar imagen al carrusel">
            <Plus className="mr-1 h-4 w-4" />Agregar
          </Button>
        )}
      </div>
    </>
  );
}
