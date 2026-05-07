import { useMemo } from 'react';
import { CheckCircle2, PackageCheck, XCircle } from 'lucide-react';
import type { Column, TableAction } from '@/presentation/shared/components/GenericTable';
import type { Purchase, PurchaseStatus } from '@/core/entities/purchase';
import { getPurchaseStatusLabel, getPurchaseStatusColor } from '@/core/entities/purchase';

const COLS: Column<Purchase>[] = [
  { key: 'purchaseNumber', label: 'Número', render: (_, r) => <span className="font-mono font-medium" title="Número de compra">{r.purchaseNumber}</span> },
  { key: 'purchaseDate', label: 'Fecha', render: (_, r) => <span title="Fecha de compra">{new Date(r.purchaseDate).toLocaleDateString('es')}</span> },
  { key: 'supplierName', label: 'Proveedor', render: (_, r) => <span title="Proveedor">{r.supplierName ?? '—'}</span> },
  { key: 'warehouseName', label: 'Almacén', render: (_, r) => <span title="Almacén">{r.warehouseName ?? '—'}</span> },
  {
    key: 'status', label: 'Estado',
    render: (_, r) => (
      <span title={`Estado: ${getPurchaseStatusLabel(r.status)}`}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${getPurchaseStatusColor(r.status)}`}>
        {getPurchaseStatusLabel(r.status)}
      </span>
    ),
  },
  { key: 'total', label: 'Total', render: (_, r) => <span className="font-mono font-medium" title="Total de la compra">{r.currencyCode} {r.total.toFixed(2)}</span> },
];

interface Options {
  onConfirm: (id: string) => void;
  onReceive: (id: string) => void;
  onCancel: (id: string) => void;
}

export function usePurchaseColumns({ onConfirm, onReceive, onCancel }: Options) {
  const columns = useMemo(() => COLS, []);
  const actions = useMemo<TableAction<Purchase>[]>(() => [
    { icon: CheckCircle2, title: 'Confirmar compra', onClick: (r) => onConfirm(r.id), hidden: (r) => r.status !== 'DRAFT' },
    { icon: PackageCheck, title: 'Registrar recepción', onClick: (r) => onReceive(r.id), hidden: (r) => r.status !== 'CONFIRMED' },
    { icon: XCircle, title: 'Cancelar compra', onClick: (r) => onCancel(r.id), hidden: (r) => (r.status as PurchaseStatus) === 'RECEIVED' || r.status === 'CANCELLED' },
  ], [onConfirm, onReceive, onCancel]);
  return { columns, actions };
}
