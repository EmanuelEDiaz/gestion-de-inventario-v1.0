'use client';

import { useMemo } from 'react';
import { CheckCircle2, Truck, XCircle } from 'lucide-react';
import { Sale, getSaleStatusLabel, getSaleStatusColor } from '@/core/entities/sale';
import { formatCurrency, formatDateShort } from '@/presentation/shared/lib/utils';
import { GenericTable, type Column, type TableAction } from '@/presentation/shared/components/GenericTable';

interface SaleTableProps {
  sales: Sale[];
  onRowClick?: (sale: Sale) => void;
  onConfirm?: (sale: Sale) => void;
  onDeliver?: (sale: Sale) => void;
  onCancel?: (sale: Sale) => void;
}

const COLUMNS: Column<Sale>[] = [
  { key: 'saleNumber', label: 'Número', render: (_, r) => <span className="font-mono">{r.saleNumber}</span> },
  { key: 'saleDate', label: 'Fecha', render: (_, r) => <span>{formatDateShort(r.saleDate)}</span> },
  { key: 'customerName', label: 'Cliente', render: (_, r) => <span>{r.customerName || '-'}</span> },
  { key: 'warehouseName', label: 'Almacén', render: (_, r) => <span>{r.warehouseName || r.warehouseId}</span> },
  {
    key: 'status', label: 'Estado',
    render: (_, r) => (
      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getSaleStatusColor(r.status)}`}>
        {getSaleStatusLabel(r.status)}
      </span>
    ),
  },
  { key: 'total', label: 'Total', className: 'text-right', render: (_, r) => <span className="font-medium">{formatCurrency(r.total, r.currencyCode)}</span> },
];

export function SaleTable({ sales, onRowClick, onConfirm, onDeliver, onCancel }: SaleTableProps) {
  const actions = useMemo<TableAction<Sale>[]>(() => [
    { icon: CheckCircle2, title: 'Confirmar', onClick: (r) => onConfirm?.(r), hidden: () => !onConfirm },
    { icon: Truck, title: 'Entregar', onClick: (r) => onDeliver?.(r), hidden: () => !onDeliver },
    { icon: XCircle, title: 'Cancelar', onClick: (r) => onCancel?.(r), hidden: () => !onCancel },
  ], [onConfirm, onDeliver, onCancel]);

  return (
    <GenericTable data={sales} columns={COLUMNS} actions={actions}
      onRowClick={onRowClick} emptyMessage="No hay ventas registradas" />
  );
}
