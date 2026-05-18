'use client';

import type { Warehouse } from '@/core/entities/warehouse';
import type { Customer } from '@/core/entities/customer';
import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';

interface SaleCustomerSelectorProps {
  warehouses: Warehouse[];
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  customers: Customer[];
  customerId: string;
  onCustomerChange: (id: string) => void;
}

export function SaleCustomerSelector({ warehouses, warehouseId, onWarehouseChange, customers, customerId, onCustomerChange }: SaleCustomerSelectorProps) {
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
        <label htmlFor="customerId" className="text-sm font-medium">Cliente</label>
        <ComboboxSelect
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          value={customerId}
          onChange={onCustomerChange}
          placeholder={customers.length === 0 ? 'No hay clientes' : 'Sin cliente...'}
        />
      </div>
    </div>
  );
}
