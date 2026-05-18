'use client';

import { Plus } from 'lucide-react';

interface ImageUploadButtonProps {
  onClick: () => void;
}

export function ImageUploadButton({ onClick }: ImageUploadButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Agregar nueva imagen"
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-50"
    >
      <Plus className="h-6 w-6 text-gray-400" />
    </button>
  );
}
