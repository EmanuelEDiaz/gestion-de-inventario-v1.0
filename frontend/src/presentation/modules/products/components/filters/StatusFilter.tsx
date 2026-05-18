'use client';

import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';
import type { ProductStatus } from '@/core/entities/product';

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'ARCHIVED', label: 'Archivado' },
];

interface StatusFilterProps {
  value: ProductStatus | '';
  onChange: (value: string) => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">Estado</label>
      <ComboboxSelect
        options={STATUS_OPTIONS}
        value={value}
        onChange={onChange}
        placeholder="Todos los estados"
      />
    </div>
  );
}
