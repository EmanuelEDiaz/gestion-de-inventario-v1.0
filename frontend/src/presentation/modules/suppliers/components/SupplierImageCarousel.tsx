'use client';

import { useState } from 'react';
import { useSupplierImages } from '../hooks/useSupplierImages';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { toast } from '@/presentation/shared/components/ui/toast';
import { Plus } from 'lucide-react';
import { SupplierImageUpload } from './SupplierImageUpload';
import { SupplierImageCard } from './SupplierImageCard';

interface SupplierImageCarouselProps {
  supplierId: string;
}

export function SupplierImageCarousel({ supplierId }: SupplierImageCarouselProps) {
  const { images, isLoading, upload, setPrimary, remove } = useSupplierImages(supplierId);
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
        <Button size="sm" onClick={() => setShowUpload(!showUpload)} title="Registrar nueva imagen">
          <Plus className="h-4 w-4 mr-1" />
          Agregar imagen
        </Button>
      </div>

      {showUpload && (
        <SupplierImageUpload
          selectedFile={selectedFile}
          uploading={uploading}
          onFileChange={setSelectedFile}
          onUpload={handleUpload}
          onCancel={() => setShowUpload(false)}
        />
      )}

      {images.length === 0 && !showUpload && <EmptyState message="Sin imágenes registradas" />}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img) => (
          <SupplierImageCard
            key={img.id}
            image={img}
            onSetPrimary={handleSetPrimary}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}
