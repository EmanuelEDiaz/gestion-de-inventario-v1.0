'use client';

import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import type { AdjustmentType } from '@/core/adjustment/entities/adjustment';
import { ADJUSTMENT_TYPE_LABELS } from '@/core/adjustment/entities/adjustment';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';

interface AdjustmentHeaderFieldsProps {
  warehouses: Warehouse[];
  warehouseId: string;
  onWarehouseChange: (value: string) => void;
  type: string;
  onTypeChange: (value: string) => void;
  warehouseError?: string;
  typeError?: string;
}

const TYPES: AdjustmentType[] = ['COUNT', 'DAMAGE', 'THEFT', 'EXPIRY', 'OTHER'];

export function AdjustmentHeaderFields({ warehouses, warehouseId, onWarehouseChange, type, onTypeChange, warehouseError, typeError }: AdjustmentHeaderFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="warehouseId" className="text-sm font-medium">Almacén *</label>
        <ComboboxSelect
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          value={warehouseId}
          onChange={onWarehouseChange}
          placeholder={warehouses.length === 0 ? 'No hay almacenes disponibles' : 'Seleccionar almacén...'}
          error={warehouseError}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Tipo de Ajuste</label>
        <ComboboxSelect
          options={TYPES.map((t) => ({ value: t, label: ADJUSTMENT_TYPE_LABELS[t] }))}
          value={type}
          onChange={onTypeChange}
          placeholder="Seleccionar tipo..."
          error={typeError}
        />
      </div>
    </div>
  );
}
