'use client';

import { useState } from 'react';
import { useSupplierImages } from '../hooks/useSupplierImages';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/EmptyState';
import { toast } from '@/presentation/shared/components/ui/toast';
import { Star, Trash2, Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
        <div className="rounded-lg border p-3 space-y-2 bg-gray-50">
          <label className="block text-sm font-medium text-gray-700" htmlFor="supplier-image-file">
            Imagen local
          </label>
          <input
            id="supplier-image-file"
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
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-lg border overflow-hidden">
            <img
              src={`${API_URL}/media${img.filePath}`}
              alt={img.originalFilename || 'Imagen proveedor'}
              className="w-full h-32 object-cover"
              title={img.originalFilename || img.filePath}
            />
            {img.isPrimary && (
              <span className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs px-1 rounded">
                Principal
              </span>
            )}
            <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
              {!img.isPrimary && (
                <button
                  className="bg-white rounded p-1 shadow"
                  onClick={() => handleSetPrimary(img.id)}
                  title="Marcar como imagen principal"
                >
                  <Star className="h-3 w-3 text-yellow-500" />
                </button>
              )}
              <button
                className="bg-white rounded p-1 shadow"
                onClick={() => handleRemove(img.id)}
                title="Eliminar imagen"
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
