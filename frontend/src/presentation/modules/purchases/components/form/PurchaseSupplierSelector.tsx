'use client';

import type { Warehouse } from '@/core/entities/warehouse';
import type { Supplier } from '@/core/entities/supplier';
import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';

interface PurchaseSupplierSelectorProps {
  warehouses: Warehouse[];
  suppliers: Supplier[];
  warehouseId: string;
  supplierId: string;
  onWarehouseChange: (v: string) => void;
  onSupplierChange: (v: string) => void;
}

export function PurchaseSupplierSelector({
  warehouses,
  suppliers,
  warehouseId,
  supplierId,
  onWarehouseChange,
  onSupplierChange,
}: PurchaseSupplierSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="warehouseId" className="text-sm font-medium">Almacén *</label>
        <ComboboxSelect
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          value={warehouseId}
          onChange={onWarehouseChange}
          placeholder={warehouses.length === 0 ? 'No hay almacenes' : 'Seleccionar...'}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="supplierId" className="text-sm font-medium">Proveedor</label>
        <ComboboxSelect
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          value={supplierId}
          onChange={onSupplierChange}
          placeholder={suppliers.length === 0 ? 'No hay proveedores' : 'Sin proveedor...'}
        />
      </div>
    </div>
  );
}
