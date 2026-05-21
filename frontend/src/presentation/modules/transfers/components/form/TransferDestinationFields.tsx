'use client';

import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';

interface TransferDestinationFieldsProps {
  warehouses: Warehouse[];
  fromWarehouseId: string;
  value: string;
  onChange: (value: string) => void;
}

export function TransferDestinationFields({ warehouses, fromWarehouseId, value, onChange }: TransferDestinationFieldsProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="toWarehouseId" className="text-sm font-medium">Almacén Destino *</label>
      <ComboboxSelect
        options={warehouses.filter((w) => w.id !== fromWarehouseId).map((w) => ({ value: w.id, label: w.name }))}
        value={value}
        onChange={onChange}
        placeholder={warehouses.length === 0 ? 'No hay almacenes' : 'Seleccionar destino...'}
      />
    </div>
  );
}
