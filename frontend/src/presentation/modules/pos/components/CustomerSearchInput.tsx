'use client';

import { Search } from '@/presentation/shared/components/ui/icon-mapping';

interface CustomerSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading: boolean;
}

export function CustomerSearchInput({ value, onChange, disabled, loading }: CustomerSearchInputProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-white">
      <Search className="h-4 w-4 text-gray-400 shrink-0" />
      <input
        type="text"
        className="flex-1 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
        placeholder="Buscar cliente..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        title="Buscar cliente por nombre, código o email"
      />
      {loading && <span className="text-xs text-gray-400">Buscando...</span>}
    </div>
  );
}
