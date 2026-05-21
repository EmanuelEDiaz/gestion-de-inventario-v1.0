import { useMemo } from 'react';
import { CheckCircle2, Trash2, XCircle } from 'lucide-react';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import type { Return } from '@/core/return/entities/return';
import { RETURN_STATUS_LABELS, RETURN_STATUS_COLORS, RETURN_TYPE_LABELS } from '@/core/return/entities/return';

const COLS: Column<Return>[] = [
  { key: 'returnNumber', label: 'Número', render: (_, r) => <span className="font-mono font-medium" title="Número de devolución">{r.returnNumber}</span> },
  { key: 'type', label: 'Tipo', render: (_, r) => <span title="Tipo de devolución">{RETURN_TYPE_LABELS[r.type]}</span> },
  { key: 'warehouseName', label: 'Almacén', render: (_, r) => <span title="Almacén">{r.warehouseName ?? '—'}</span> },
  {
    key: 'status', label: 'Estado',
    render: (_, r) => (
      <span title={`Estado: ${RETURN_STATUS_LABELS[r.status]}`}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${RETURN_STATUS_COLORS[r.status]}`}>
        {RETURN_STATUS_LABELS[r.status]}
      </span>
    ),
  },
  { key: 'returnDate', label: 'Fecha', render: (_, r) => <span title="Fecha de devolución">{new Date(r.returnDate).toLocaleDateString('es')}</span> },
  { key: 'totalAmount', label: 'Total', render: (_, r) => <span className="font-mono font-medium" title="Total de la devolución">{r.totalAmount.toFixed(2)}</span> },
];

interface Options {
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

export function useReturnColumns({ onConfirm, onCancel, onDelete }: Options) {
  const columns = useMemo(() => COLS, []);
  const actions = useMemo<TableAction<Return>[]>(() => [
    { icon: CheckCircle2, title: 'Confirmar devolución', onClick: (r) => onConfirm(r.id), hidden: (r) => r.status !== 'DRAFT' },
    { icon: XCircle, title: 'Cancelar devolución', onClick: (r) => onCancel(r.id), hidden: (r) => r.status !== 'DRAFT' },
    { icon: Trash2, title: 'Eliminar devolución', onClick: (r) => onDelete(r.id), hidden: (r) => r.status !== 'DRAFT' },
  ], [onConfirm, onCancel, onDelete]);
  return { columns, actions };
}
