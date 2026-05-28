'use client';

import { Star, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { getMediaUrl } from '@/presentation/shared/lib/utils';

interface SupplierImageCardImage {
  id: string;
  filePath: string;
  originalFilename?: string | null;
  isPrimary: boolean;
}

interface SupplierImageCardProps {
  image: SupplierImageCardImage;
  onSetPrimary: (imageId: string) => void;
  onRemove: (imageId: string) => void;
}

export function SupplierImageCard({ image, onSetPrimary, onRemove }: SupplierImageCardProps) {
  return (
    <div className="relative group rounded-lg border overflow-hidden">
      <img
        src={getMediaUrl(image.filePath)}
        alt={image.originalFilename || 'Imagen proveedor'}
        className="w-full h-32 object-cover"
        title={image.originalFilename || image.filePath}
      />
      {image.isPrimary && (
        <span className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs px-1 rounded">
          Principal
        </span>
      )}
      <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
        {!image.isPrimary && (
          <button
            className="bg-white rounded p-1 shadow"
            onClick={() => onSetPrimary(image.id)}
            title="Marcar como imagen principal"
          >
            <Star className="h-3 w-3 text-yellow-500" />
          </button>
        )}
        <button
          className="bg-white rounded p-1 shadow"
          onClick={() => onRemove(image.id)}
          title="Eliminar imagen"
        >
          <Trash2 className="h-3 w-3 text-red-500" />
        </button>
      </div>
    </div>
  );
}
