'use client';

import type { ReturnType as ReturnDocType } from '@/core/return/entities/return';
import { RETURN_TYPE_LABELS } from '@/core/return/entities/return';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import { Input } from '@/presentation/shared/components/ui/Input';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';

interface ReturnFormBasicFieldsProps {
  type: ReturnDocType;
  warehouseId: string;
  originalDocumentId: string;
  reason: string;
  warehouses: Warehouse[];
  onTypeChange: (val: ReturnDocType) => void;
  onWarehouseChange: (val: string) => void;
  onOriginalDocumentChange: (val: string) => void;
  onReasonChange: (val: string) => void;
}

const RETURN_TYPES: ReturnDocType[] = ['SALE_RETURN', 'PURCHASE_RETURN'];

export function ReturnFormBasicFields({
  type, warehouseId, originalDocumentId, reason,
  warehouses, onTypeChange, onWarehouseChange,
  onOriginalDocumentChange, onReasonChange,
}: ReturnFormBasicFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <label className="text-sm font-medium">Tipo de Devolución</label>
        <ComboboxSelect
          options={RETURN_TYPES.map((t) => ({ value: t, label: RETURN_TYPE_LABELS[t] }))}
          value={type}
          onChange={(val) => onTypeChange(val as ReturnDocType)}
          placeholder="Seleccionar tipo..."
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="warehouseId" className="text-sm font-medium">Almacén *</label>
        <ComboboxSelect
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          value={warehouseId}
          onChange={onWarehouseChange}
          placeholder={warehouses.length === 0 ? 'No hay almacenes disponibles' : 'Seleccionar almacén...'}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="originalDocumentId" className="text-sm font-medium">Documento Original</label>
        <Input id="originalDocumentId" value={originalDocumentId} onChange={(e) => onOriginalDocumentChange(e.target.value)} placeholder="ID de la venta/compra original" title="ID del documento original" />
      </div>
      <div className="space-y-1">
        <label htmlFor="reason" className="text-sm font-medium">Razón</label>
        <Input id="reason" value={reason} onChange={(e) => onReasonChange(e.target.value)} placeholder="Motivo de la devolución" title="Razón de la devolución" />
      </div>
    </div>
  );
}
