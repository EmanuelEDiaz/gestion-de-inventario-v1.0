'use client';

import { useState } from 'react';
import { useProductImages } from '../hooks/useProductImages';
import { ImageLightbox } from './ImageLightbox';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/presentation/shared/components/ui/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const MAX_IMAGES = 8;
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FILE_INPUT_ID = 'product-image-upload';

interface ProductImageGalleryProps {
  productId: string;
}

export function ProductImageGallery({ productId }: ProductImageGalleryProps) {
  const { images, isLoading, upload } = useProductImages(productId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
      await upload.mutateAsync({ file, isPrimary: images.length === 0 });
      toast.success('Imagen subida');
    } catch {
      toast.error('Error al subir imagen');
    }
    const fileInput = document.getElementById(FILE_INPUT_ID) as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  if (isLoading) return <LoadingSpinner />;
  
  const primaryImage = images.find(img => img.isPrimary);
  const otherImages = images.filter(img => !img.isPrimary);
  const canAdd = images.length < MAX_IMAGES;

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        id={FILE_INPUT_ID}
        disabled={!canAdd}
      />

      {primaryImage ? (
        <TooltipWrapper content="Imagen principal del producto. Toca para ver en grande.">
          <div 
            onClick={() => setLightboxIndex(images.indexOf(primaryImage))}
            className="relative aspect-video rounded-lg overflow-hidden cursor-zoom-in border bg-gray-100"
          >
            <img src={`${API_URL}${primaryImage.filePath}`} alt="Principal" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-yellow-400/90 text-yellow-900 text-xs px-2 py-1 rounded font-medium">
              Principal
            </div>
          </div>
        </TooltipWrapper>
      ) : (
        <label 
          htmlFor={FILE_INPUT_ID}
          className="block aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400"
        >
          <div className="text-center text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Sin imagen principal</p>
          </div>
        </label>
      )}

      {otherImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-2">
          {otherImages.map((img, idx) => (
            <TooltipWrapper key={img.id} content={`Imagen ${idx + 2}. Toca para ver en grande.`}>
              <div 
                onClick={() => setLightboxIndex(images.indexOf(img))}
                className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-zoom-in border bg-gray-100 hover:ring-2 hover:ring-blue-500"
              >
                <img src={`${API_URL}${img.filePath}`} alt="" className="w-full h-full object-cover" />
              </div>
            </TooltipWrapper>
          ))}
          {canAdd && (
            <button 
              onClick={triggerFileInput}
              className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400"
            >
              <Plus className="h-6 w-6 text-gray-400" />
            </button>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{images.length}/{MAX_IMAGES} imágenes</span>
        {canAdd && (
          <Button size="sm" onClick={triggerFileInput}>
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