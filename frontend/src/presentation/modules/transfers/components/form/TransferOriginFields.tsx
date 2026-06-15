'use client';

import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';

interface TransferOriginFieldsProps {
  warehouses: Warehouse[];
  value: string;
  onChange: (value: string) => void;
  fromWarehouseError?: string;
}

export function TransferOriginFields({ warehouses, value, onChange, fromWarehouseError }: TransferOriginFieldsProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="fromWarehouseId" className="text-sm font-medium">Almacén Origen *</label>
      <ComboboxSelect
        options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
        value={value}
        onChange={onChange}
        placeholder={warehouses.length === 0 ? 'No hay almacenes' : 'Seleccionar origen...'}
        error={fromWarehouseError}
      />
    </div>
  );
}
