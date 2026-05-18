'use client';

import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';
import type { UnitOfMeasure } from '@/core/entities/product';

const UNIT_OPTIONS: { value: UnitOfMeasure; label: string }[] = [
  { value: 'UNIT', label: 'Unidad' },
  { value: 'KG', label: 'Kilogramo' },
  { value: 'L', label: 'Litro' },
  { value: 'M', label: 'Metro' },
  { value: 'M2', label: 'Metro²' },
  { value: 'BOX', label: 'Caja' },
  { value: 'PACK', label: 'Paquete' },
];

interface UnitFilterProps {
  value: UnitOfMeasure | '';
  onChange: (value: string) => void;
}

export function UnitFilter({ value, onChange }: UnitFilterProps) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">Unidad de Medida</label>
      <ComboboxSelect
        options={UNIT_OPTIONS}
        value={value}
        onChange={onChange}
        placeholder="Todas"
      />
    </div>
  );
}
