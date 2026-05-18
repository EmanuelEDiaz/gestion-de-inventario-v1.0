'use client';

import { ImagePlus } from 'lucide-react';

interface CreateImageEmptyStateProps {
  inputId: string;
}

export function CreateImageEmptyState({ inputId }: CreateImageEmptyStateProps) {
  return (
    <label
      htmlFor={inputId}
      title="Selecciona imágenes para el carrusel del producto"
      className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50"
    >
      <ImagePlus className="h-6 w-6" />
      <p className="text-sm">Selecciona hasta 8 imágenes (jpg, png, webp)</p>
    </label>
  );
}
