'use client';

import { useState } from 'react';
import { useCustomerImages } from '../hooks/useCustomerImages';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { toast } from '@/presentation/shared/components/ui/toast';
import { Plus } from '@/presentation/shared/components/ui/icon-mapping';
import { CustomerImageUpload } from './CustomerImageUpload';
import { CustomerImageCard } from './CustomerImageCard';

interface CustomerImageCarouselProps {
  customerId: string;
}

export function CustomerImageCarousel({ customerId }: CustomerImageCarouselProps) {
  const { images, isLoading, upload, setPrimary, remove } = useCustomerImages(customerId);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await upload.mutateAsync({
        file: selectedFile,
        isPrimary: images.length === 0,
        sortOrder: images.length,
      });
      toast.success('Imagen subida');
      setSelectedFile(null);
      setShowUpload(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await setPrimary.mutateAsync(imageId);
      toast.success('Imagen principal actualizada');
    } catch {
      toast.error('Error al actualizar imagen principal');
    }
  };

  const handleRemove = async (imageId: string) => {
    try {
      await remove.mutateAsync(imageId);
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar imagen');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{images.length} imagen(es)</span>
        <TooltipWrapper content="Agregar nueva imagen">
          <Button size="sm" onClick={() => setShowUpload(!showUpload)} title="Registrar nueva imagen">
            <Plus className="h-4 w-4 mr-1" />
            Agregar imagen
          </Button>
        </TooltipWrapper>
      </div>

      {showUpload && (
        <CustomerImageUpload
          selectedFile={selectedFile}
          uploading={uploading}
          onFileChange={setSelectedFile}
          onUpload={handleUpload}
          onCancel={() => setShowUpload(false)}
        />
      )}

      {images.length === 0 && !showUpload && <EmptyState message="Sin imágenes registradas" />}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((image) => (
          <CustomerImageCard
            key={image.id}
            image={image}
            onSetPrimary={handleSetPrimary}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}
