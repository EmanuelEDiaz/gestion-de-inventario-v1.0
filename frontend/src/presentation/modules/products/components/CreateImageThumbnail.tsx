'use client';

import { Star, Trash2 } from 'lucide-react';

interface CreateImageThumbnailProps {
  src: string;
  alt: string;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
}

export function CreateImageThumbnail({
  src,
  alt,
  isPrimary,
  onSetPrimary,
  onRemove,
}: CreateImageThumbnailProps) {
  return (
    <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      <div className="absolute inset-0 flex items-end justify-between bg-linear-to-t from-black/65 via-black/10 to-transparent p-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          type="button"
          title="Definir como imagen principal"
          onClick={onSetPrimary}
          className="rounded bg-white/90 p-1 text-amber-600 hover:bg-white"
        >
          <Star className="h-3.5 w-3.5" fill={isPrimary ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          title="Eliminar esta imagen"
          onClick={onRemove}
          className="rounded bg-white/90 p-1 text-danger hover:bg-white"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
