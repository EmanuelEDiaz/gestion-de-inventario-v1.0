import { useMemo } from 'react';
import { CheckCircle2, Truck, XCircle } from 'lucide-react';
import type { Column, TableAction } from '@/presentation/shared/components/GenericTable';
import type { Sale, SaleStatus } from '@/core/entities/sale';
import { getSaleStatusLabel, getSaleStatusColor } from '@/core/entities/sale';

const COLS: Column<Sale>[] = [
  { key: 'saleNumber', label: 'Número', render: (_, r) => <span className="font-mono font-medium" title="Número de venta">{r.saleNumber}</span> },
  { key: 'saleDate', label: 'Fecha', render: (_, r) => <span title="Fecha de venta">{new Date(r.saleDate).toLocaleDateString('es')}</span> },
  { key: 'customerName', label: 'Cliente', render: (_, r) => <span title="Cliente">{r.customerName ?? '—'}</span> },
  { key: 'warehouseName', label: 'Almacén', render: (_, r) => <span title="Almacén">{r.warehouseName ?? '—'}</span> },
  {
    key: 'status', label: 'Estado',
    render: (_, r) => (
      <span title={`Estado: ${getSaleStatusLabel(r.status)}`}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${getSaleStatusColor(r.status)}`}>
        {getSaleStatusLabel(r.status)}
      </span>
    ),
  },
  { key: 'total', label: 'Total', render: (_, r) => <span className="font-mono font-medium" title="Total de la venta">{r.currencyCode} {r.total.toFixed(2)}</span> },
];

interface Options {
  onConfirm: (id: string) => void;
  onDeliver: (id: string) => void;
  onCancel: (id: string) => void;
}

export function useSaleColumns({ onConfirm, onDeliver, onCancel }: Options) {
  const columns = useMemo(() => COLS, []);
  const actions = useMemo<TableAction<Sale>[]>(() => [
    { icon: CheckCircle2, title: 'Confirmar venta', onClick: (r) => onConfirm(r.id), hidden: (r) => r.status !== 'DRAFT' },
    { icon: Truck, title: 'Marcar como entregada', onClick: (r) => onDeliver(r.id), hidden: (r) => r.status !== 'CONFIRMED' },
    { icon: XCircle, title: 'Cancelar venta', onClick: (r) => onCancel(r.id), hidden: (r) => (r.status as SaleStatus) === 'DELIVERED' || r.status === 'CANCELLED' },
  ], [onConfirm, onDeliver, onCancel]);
  return { columns, actions };
}
