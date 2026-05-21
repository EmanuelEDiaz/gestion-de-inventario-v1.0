import { useMemo } from 'react';
import { CheckCircle2, PackageCheck, Send, Trash2, XCircle } from 'lucide-react';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import type { Transfer } from '@/core/transfer/entities/transfer';
import { TRANSFER_STATUS_LABELS, TRANSFER_STATUS_COLORS } from '@/core/transfer/entities/transfer';

const COLS: Column<Transfer>[] = [
  { key: 'transferNumber', label: 'Número', render: (_, r) => <span className="font-mono font-medium" title="Número de transferencia">{r.transferNumber}</span> },
  { key: 'fromWarehouseName', label: 'Origen → Destino', render: (_, r) => <span title="Almacenes de origen y destino">{r.fromWarehouseName ?? '—'} → {r.toWarehouseName ?? '—'}</span> },
  {
    key: 'status', label: 'Estado',
    render: (_, r) => (
      <span title={`Estado: ${TRANSFER_STATUS_LABELS[r.status]}`}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${TRANSFER_STATUS_COLORS[r.status]}`}>
        {TRANSFER_STATUS_LABELS[r.status]}
      </span>
    ),
  },
  { key: 'transferDate', label: 'Fecha', render: (_, r) => <span title="Fecha de transferencia">{new Date(r.transferDate).toLocaleDateString('es')}</span> },
  { key: 'lines', label: 'Productos', render: (_, r) => <span title="Número de líneas">{r.lines.length}</span> },
];

interface Options {
  onConfirm: (id: string) => void;
  onShip: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

export function useTransferColumns({ onConfirm, onShip, onComplete, onCancel, onDelete }: Options) {
  const columns = useMemo(() => COLS, []);
  const actions = useMemo<TableAction<Transfer>[]>(() => [
    { icon: CheckCircle2, title: 'Confirmar transferencia', onClick: (r) => onConfirm(r.id), hidden: (r) => r.status !== 'DRAFT' },
    { icon: Send, title: 'Despachar transferencia', onClick: (r) => onShip(r.id), hidden: (r) => r.status !== 'CONFIRMED' },
    { icon: PackageCheck, title: 'Completar recepción', onClick: (r) => onComplete(r.id), hidden: (r) => r.status !== 'IN_TRANSIT' },
    { icon: XCircle, title: 'Cancelar transferencia', onClick: (r) => onCancel(r.id), hidden: (r) => r.status === 'COMPLETED' || r.status === 'CANCELLED' },
    { icon: Trash2, title: 'Eliminar transferencia', onClick: (r) => onDelete(r.id), hidden: (r) => r.status !== 'DRAFT' },
  ], [onConfirm, onShip, onComplete, onCancel, onDelete]);
  return { columns, actions };
}
