'use client';

import { useState } from 'react';
import { useProductImages } from '../hooks/useProductImages';
import { ImageLightbox } from './ImageLightbox';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Plus, Image as ImageIcon, Star, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/presentation/shared/components/ui/toast';
import { getMediaUrl } from '@/presentation/shared/lib/utils';
const MAX_IMAGES = 8;
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FILE_INPUT_ID = 'product-image-upload';

interface ProductImageGalleryProps {
  productId: string;
  editable?: boolean;
}

export function ProductImageGallery({ productId, editable = false }: ProductImageGalleryProps) {
  const { images, isLoading, upload, setPrimary, remove } = useProductImages(productId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  const triggerFileInput = () => {
    const fileInput = document.getElementById(FILE_INPUT_ID) as HTMLInputElement | null;
    fileInput?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`El archivo supera ${MAX_SIZE_MB} MB`);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato no permitido');
      return;
    }
    
    try {
      setIsBusy(true);
      await upload.mutateAsync({ file, isPrimary: images.length === 0 });
      toast.success('Imagen subida');
    } catch {
      toast.error('Error al subir imagen');
    } finally {
      setIsBusy(false);
    }
    const fileInput = document.getElementById(FILE_INPUT_ID) as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      setIsBusy(true);
      await setPrimary.mutateAsync(imageId);
      toast.success('Imagen principal actualizada');
    } catch {
      toast.error('No se pudo definir imagen principal');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      setIsBusy(true);
      await remove.mutateAsync(imageId);
      setActiveIndex((prev) => Math.max(0, prev - 1));
      toast.success('Imagen eliminada');
    } catch {
      toast.error('No se pudo eliminar la imagen');
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const canAdd = images.length < MAX_IMAGES;
  const safeActiveIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));
  const activeImage = images[safeActiveIndex];
  const isPrimary = activeImage?.isPrimary ?? false;
  const goNext = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

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

      {activeImage ? (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
          <TooltipWrapper content="Haz click para abrir vista ampliada de la imagen">
            <div
              onClick={() => setLightboxIndex(safeActiveIndex)}
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

          {images.length > 1 && (
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
                  onClick={() => handleSetPrimary(activeImage.id)}
                  className="rounded-full bg-white/95 p-2 text-amber-600 shadow transition hover:bg-white disabled:opacity-50"
                >
                  <Star className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                title="Eliminar imagen actual"
                disabled={isBusy}
                onClick={() => handleDelete(activeImage.id)}
                className="rounded-full bg-white/95 p-2 text-danger shadow transition hover:bg-white disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1 text-xs text-white">
            {safeActiveIndex + 1} / {images.length}
          </div>
        </div>
      ) : (
        <label 
          htmlFor={FILE_INPUT_ID}
          className="aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-50"
        >
          <div className="text-center text-slate-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Sin imagen principal</p>
          </div>
        </label>
      )}

      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <TooltipWrapper key={img.id} content={`Ir a imagen ${idx + 1}`}>
              <div 
                onClick={() => setActiveIndex(idx)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-gray-100 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${
                  safeActiveIndex === idx ? 'ring-2 ring-cyan-500 border-cyan-500' : 'border-slate-200'
                }`}
              >
                <img src={getMediaUrl(img.filePath)} alt="" className="w-full h-full object-cover" />
                {img.isPrimary && (
                  <span className="absolute left-1 top-1 rounded bg-amber-300 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950">
                    P
                  </span>
                )}
              </div>
            </TooltipWrapper>
          ))}

          {canAdd && editable && (
            <button 
              onClick={triggerFileInput}
              title="Agregar nueva imagen"
              className="h-20 w-20 shrink-0 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-500 transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-50"
            >
              <Plus className="h-6 w-6 text-gray-400" />
            </button>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{images.length}/{MAX_IMAGES} imágenes</span>
        {canAdd && editable && (
          <Button size="sm" onClick={triggerFileInput} title="Agregar imagen al carrusel">
            <Plus className="h-4 w-4 mr-1" />Agregar
          </Button>
        )}
      </div>

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