'use client';

import { useImageGallery } from '../hooks/useImageGallery';
import { ImageLightbox } from './ImageLightbox';
import { ImageGalleryGrid } from './ImageGalleryGrid';
import { ImageThumbnailsBar } from './ImageThumbnailsBar';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';

interface ProductImageGalleryProps {
  productId: string;
  editable?: boolean;
}

export function ProductImageGallery({ productId, editable = false }: ProductImageGalleryProps) {
  const {
    images, isLoading, isBusy, lightboxIndex, canAdd, safeActiveIndex, activeImage, isPrimary,
    goNext, goPrev, setActiveIndex,
    triggerFileInput, handleFileSelect, handleSetPrimary, handleDelete,
    setLightboxIndex, FILE_INPUT_ID, MAX_IMAGES, ALLOWED_TYPES,
  } = useImageGallery(productId);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        id={FILE_INPUT_ID}
        disabled={!canAdd || !editable}
      />

      <ImageGalleryGrid
        activeImage={activeImage}
        safeActiveIndex={safeActiveIndex}
        isPrimary={isPrimary}
        imagesLength={images.length}
        editable={editable}
        isBusy={isBusy}
        fileInputId={FILE_INPUT_ID}
        onLightboxOpen={setLightboxIndex}
        onSetPrimary={handleSetPrimary}
        onDelete={handleDelete}
        goNext={goNext}
        goPrev={goPrev}
      />

      {images.length > 0 && (
        <ImageThumbnailsBar
          images={images}
          safeActiveIndex={safeActiveIndex}
          canAdd={canAdd}
          editable={editable}
          maxImages={MAX_IMAGES}
          onThumbnailClick={setActiveIndex}
          onUploadClick={triggerFileInput}
        />
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
