'use client';

import { useState } from 'react';
import { useProductImages } from '../hooks/useProductImages';
import { toast } from '@/presentation/shared/components/ui/toast';

const MAX_IMAGES = 8;
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FILE_INPUT_ID = 'product-image-upload';

export function useImageGallery(productId: string) {
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

  const canAdd = images.length < MAX_IMAGES;
  const safeActiveIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));
  const activeImage = images[safeActiveIndex];
  const isPrimary = activeImage?.isPrimary ?? false;
  const goNext = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

  return {
    images, isLoading, isBusy, lightboxIndex, canAdd, safeActiveIndex, activeImage, isPrimary,
    goNext, goPrev, activeIndex, setActiveIndex,
    triggerFileInput, handleFileSelect, handleSetPrimary, handleDelete,
    setLightboxIndex, FILE_INPUT_ID, MAX_IMAGES, ALLOWED_TYPES,
  };
}
