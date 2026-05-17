'use client';

import { useMemo } from 'react';
import { CheckCircle2, PackageCheck, XCircle } from 'lucide-react';
import { Purchase, getPurchaseStatusLabel, getPurchaseStatusColor } from '@/core/entities/purchase';
import { formatCurrency, formatDateShort } from '@/presentation/shared/lib/utils';
import { GenericTable, type Column, type TableAction } from '@/presentation/shared/components/GenericTable';

interface PurchaseTableProps {
  purchases: Purchase[];
  onRowClick?: (purchase: Purchase) => void;
  onConfirm?: (purchase: Purchase) => void;
  onReceive?: (purchase: Purchase) => void;
  onCancel?: (purchase: Purchase) => void;
}

const COLUMNS: Column<Purchase>[] = [
  { key: 'purchaseNumber', label: 'Número', render: (_, r) => <span className="font-mono">{r.purchaseNumber}</span> },
  { key: 'purchaseDate', label: 'Fecha', render: (_, r) => <span>{formatDateShort(r.purchaseDate)}</span> },
  { key: 'supplierName', label: 'Proveedor', render: (_, r) => <span>{r.supplierName || '-'}</span> },
  { key: 'warehouseName', label: 'Almacén', render: (_, r) => <span>{r.warehouseName || r.warehouseId}</span> },
  {
    key: 'status', label: 'Estado',
    render: (_, r) => (
      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getPurchaseStatusColor(r.status)}`}>
        {getPurchaseStatusLabel(r.status)}
      </span>
    ),
  },
  { key: 'total', label: 'Total', className: 'text-right', render: (_, r) => <span className="font-medium">{formatCurrency(r.total, r.currencyCode)}</span> },
];

export function PurchaseTable({ purchases, onRowClick, onConfirm, onReceive, onCancel }: PurchaseTableProps) {
  const actions = useMemo<TableAction<Purchase>[]>(() => [
    { icon: CheckCircle2, title: 'Confirmar', onClick: (r) => onConfirm?.(r), hidden: () => !onConfirm },
    { icon: PackageCheck, title: 'Recibir', onClick: (r) => onReceive?.(r), hidden: () => !onReceive },
    { icon: XCircle, title: 'Cancelar', onClick: (r) => onCancel?.(r), hidden: () => !onCancel },
  ], [onConfirm, onReceive, onCancel]);

  return (
    <GenericTable data={purchases} columns={COLUMNS} actions={actions}
      onRowClick={onRowClick} emptyMessage="No hay compras registradas" />
  );
}
