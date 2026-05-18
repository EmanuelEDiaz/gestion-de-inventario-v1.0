'use client';

import { useEffect, useMemo } from 'react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { toast } from '@/presentation/shared/components/ui/toast';
import { CreateImagePreview } from './CreateImagePreview';
import { CreateImageThumbnail } from './CreateImageThumbnail';
import { CreateImageThumbnailsBar } from './CreateImageThumbnailsBar';
import { CreateImageEmptyState } from './CreateImageEmptyState';

const MAX_IMAGES = 8;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const INPUT_ID = 'create-product-images';

interface ProductCreateImageCarouselProps {
  files: File[];
  primaryIndex: number;
  onChange: (files: File[], primaryIndex: number) => void;
}

export function ProductCreateImageCarousel({ files, primaryIndex, onChange }: ProductCreateImageCarouselProps) {
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );
  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = Array.from(event.target.files ?? []);
    if (inputFiles.length === 0) return;
    const validFiles = inputFiles.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) { toast.error(`Formato no permitido: ${file.name}`); return false; }
      if (file.size > MAX_SIZE_BYTES) { toast.error(`El archivo ${file.name} supera 5MB`); return false; }
      return true;
    });
    const combined = [...files, ...validFiles].slice(0, MAX_IMAGES);
    if (combined.length < files.length + validFiles.length) toast.error('Máximo 8 imágenes por producto');
    onChange(combined, Math.min(primaryIndex, Math.max(combined.length - 1, 0)));
    event.target.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    const nextFiles = files.filter((_, idx) => idx !== indexToRemove);
    const nextPrimary = indexToRemove === primaryIndex ? 0
      : indexToRemove < primaryIndex ? primaryIndex - 1 : primaryIndex;
    onChange(nextFiles, Math.max(0, Math.min(nextPrimary, Math.max(nextFiles.length - 1, 0))));
  };

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Imágenes del producto</h3>
        <span className="text-xs text-slate-500">{files.length}/{MAX_IMAGES}</span>
      </div>
      {previews.length === 0 ? (
        <CreateImageEmptyState inputId={INPUT_ID} />
      ) : (
        <div className="space-y-3">
          <CreateImagePreview src={previews[primaryIndex]?.url ?? ''} alt="Vista principal del producto" />
          <CreateImageThumbnailsBar canAddMore={files.length < MAX_IMAGES}>
            {previews.map((preview, index) => (
              <CreateImageThumbnail
                key={`${preview.file.name}-${index}`}
                src={preview.url}
                alt={`Imagen ${index + 1}`}
                isPrimary={index === primaryIndex}
                onSetPrimary={() => onChange(files, index)}
                onRemove={() => removeImage(index)}
              />
            ))}
          </CreateImageThumbnailsBar>
        </div>
      )}
      <input id={INPUT_ID} type="file" accept="image/jpeg,image/png,image/webp" multiple title="Seleccionar imágenes del producto" className="hidden" onChange={handleFilesSelected} />
      <div className="flex justify-end">
        <Button type="button" variant="ghost" title="Limpiar imágenes seleccionadas" onClick={() => onChange([], 0)} disabled={files.length === 0}>
          Limpiar imágenes
        </Button>
      </div>
    </section>
  );
}
