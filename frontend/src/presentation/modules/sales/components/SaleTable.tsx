'use client';

import { CheckCircle2, Truck, XCircle } from 'lucide-react';
import { Sale, getSaleStatusLabel, getSaleStatusColor } from '@/core/entities/sale';
import { formatCurrency, formatDateShort } from '@/presentation/shared/lib/utils';
import { GenericTable, type Column } from '@/presentation/shared/components/GenericTable';
import { useStatusActions } from '@/presentation/shared/hooks/useStatusActions';

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
  const actions = useStatusActions([
    { icon: CheckCircle2, label: 'Confirmar', onClick: onConfirm ? (r) => onConfirm(r) : undefined },
    { icon: Truck, label: 'Entregar', onClick: onDeliver ? (r) => onDeliver(r) : undefined },
    { icon: XCircle, label: 'Cancelar', onClick: onCancel ? (r) => onCancel(r) : undefined },
  ]);

  return (
    <GenericTable data={sales} columns={COLUMNS} actions={actions}
      onRowClick={onRowClick} emptyMessage="No hay ventas registradas" />
  );
}
