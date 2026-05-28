'use client';

import { CheckCircle2, PackageCheck, XCircle } from '@/presentation/shared/components/ui/icon-mapping';
import { Purchase, getPurchaseStatusLabel, getPurchaseStatusColor } from '@/core/purchase/entities/purchase';
import { formatCurrency, formatDateShort } from '@/presentation/shared/lib/utils';
import { GenericTable, type Column } from '@/presentation/shared/components/data-display/GenericTable';
import { useStatusActions } from '@/presentation/shared/hooks/ui/useStatusActions';

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
  const actions = useStatusActions<Purchase>([
    { icon: CheckCircle2, label: 'Confirmar', onClick: onConfirm ? (r) => onConfirm(r) : undefined },
    { icon: PackageCheck, label: 'Recibir', onClick: onReceive ? (r) => onReceive(r) : undefined },
    { icon: XCircle, label: 'Cancelar', onClick: onCancel ? (r) => onCancel(r) : undefined },
  ]);

  return (
    <GenericTable data={purchases} columns={COLUMNS} actions={actions}
      onRowClick={onRowClick} emptyMessage="No hay compras registradas" />
  );
}
