'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Star, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { getMediaUrl } from '@/presentation/shared/lib/utils';

interface CustomerImageCardImage {
  id: string;
  filePath: string;
  originalFilename?: string | null;
  isPrimary: boolean;
}

interface CustomerImageCardProps {
  image: CustomerImageCardImage;
  onSetPrimary: (imageId: string) => void;
  onRemove: (imageId: string) => void;
}

export function CustomerImageCard({ image, onSetPrimary, onRemove }: CustomerImageCardProps) {
  return (
    <div className="relative group rounded-lg overflow-hidden border bg-gray-100 aspect-square">
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
          <TooltipWrapper content="Hacer imagen principal">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSetPrimary(image.id)}
              title="Hacer imagen principal"
              className="text-white hover:text-yellow-300"
            >
              <Star className="h-4 w-4" />
            </Button>
          </TooltipWrapper>
        )}
        <TooltipWrapper content="Eliminar imagen">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(image.id)}
            title="Eliminar imagen"
            className="text-white hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipWrapper>
      </div>
    </div>
  );
}
