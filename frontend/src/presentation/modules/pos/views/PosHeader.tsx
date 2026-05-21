'use client';

import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { FiarButton } from '../components/FiarButton';
import { CustomerSelector } from '../components/CustomerSelector';
import { Input } from '@/presentation/shared/components/ui/Input';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';

interface PosHeaderProps {
  warehouses: Warehouse[];
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  paymentMode: string;
  customerName?: string;
  hasCustomer: boolean;
  onPaymentModeChange: (mode: string) => void;
  customer: unknown;
  onCustomerChange: (customer: unknown) => void;
  productSearch: string;
  onProductSearchChange: (value: string) => void;
}

export function PosHeader({
  warehouses,
  warehouseId,
  onWarehouseChange,
  paymentMode,
  customerName,
  hasCustomer,
  onPaymentModeChange,
  customer,
  onCustomerChange,
  productSearch,
  onProductSearchChange,
}: PosHeaderProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <ComboboxSelect
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          value={warehouseId}
          onChange={onWarehouseChange}
          placeholder="Seleccionar almacén..."
          className="w-48"
        />
        <FiarButton
          paymentMode={paymentMode}
          customerName={customerName}
          hasCustomer={hasCustomer}
          onChange={onPaymentModeChange}
        />
      </div>
      {(paymentMode === 'CREDIT' || paymentMode === 'RESERVE') && (
        <CustomerSelector
          value={customer}
          onChange={onCustomerChange}
        />
      )}
      <Input
        label=""
        placeholder="Buscar producto por nombre o SKU..."
        value={productSearch}
        onChange={(e) => onProductSearchChange(e.target.value)}
        title="Buscar producto para agregar al carrito"
      />
    </>
  );
}
