'use client';

import { useState } from 'react';
import { useCustomerImages } from '../hooks/useCustomerImages';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/EmptyState';
import { toast } from '@/presentation/shared/components/ui/toast';
import { Star, Trash2, Plus } from 'lucide-react';
import { getMediaUrl } from '@/presentation/shared/lib/utils';

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
        <Button size="sm" onClick={() => setShowUpload(!showUpload)} title="Registrar nueva imagen">
          <Plus className="h-4 w-4 mr-1" />
          Agregar imagen
        </Button>
      </div>

      {showUpload && (
        <div className="rounded-lg border p-3 space-y-2 bg-gray-50">
          <label className="block text-sm font-medium text-gray-700" htmlFor="customer-image-file">
            Imagen local
          </label>
          <input
            id="customer-image-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            title="Selecciona una imagen local para subir al servidor"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowUpload(false)} title="Cancelar">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              title="Subir imagen seleccionada"
            >
              {uploading ? 'Subiendo...' : 'Subir'}
            </Button>
          </div>
        </div>
      )}

      {images.length === 0 && !showUpload && <EmptyState message="Sin imágenes registradas" />}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((image) => (
          <div key={image.id} className="relative group rounded-lg overflow-hidden border bg-gray-100 aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getMediaUrl(image.filePath)}
              alt={image.originalFilename || 'Imagen del cliente'}
              className="w-full h-full object-cover"
            />
            {image.isPrimary && (
              <span className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs px-1 py-0.5 rounded font-medium">
                Principal
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!image.isPrimary && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSetPrimary(image.id)}
                  title="Hacer imagen principal"
                  className="text-white hover:text-yellow-300"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemove(image.id)}
                title="Eliminar imagen"
                className="text-white hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
