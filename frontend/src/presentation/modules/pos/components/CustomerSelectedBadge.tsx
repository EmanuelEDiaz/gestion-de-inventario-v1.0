'use client';

import { X } from 'lucide-react';

interface CustomerSelectedBadgeProps {
  name: string;
  onClear: () => void;
}

export function CustomerSelectedBadge({ name, onClear }: CustomerSelectedBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-blue-50 text-sm">
      <span className="font-medium text-blue-800 truncate" title={name}>{name}</span>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto shrink-0 text-blue-500 hover:text-blue-700"
        title="Quitar cliente seleccionado"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
