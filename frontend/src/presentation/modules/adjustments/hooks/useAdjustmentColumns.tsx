import { useMemo } from 'react';
import { CheckCircle2, Trash2, XCircle } from 'lucide-react';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import type { Adjustment } from '@/core/adjustment/entities/adjustment';
import { ADJUSTMENT_STATUS_LABELS, ADJUSTMENT_STATUS_COLORS, ADJUSTMENT_TYPE_LABELS } from '@/core/adjustment/entities/adjustment';

const COLS: Column<Adjustment>[] = [
  { key: 'adjustmentNumber', label: 'Número', render: (_, r) => <span className="font-mono font-medium" title="Número de ajuste">{r.adjustmentNumber}</span> },
  { key: 'warehouseName', label: 'Almacén', render: (_, r) => <span title="Almacén">{r.warehouseName ?? '—'}</span> },
  { key: 'type', label: 'Tipo', render: (_, r) => <span title="Tipo de ajuste">{ADJUSTMENT_TYPE_LABELS[r.type]}</span> },
  {
    key: 'status', label: 'Estado',
    render: (_, r) => (
      <span title={`Estado: ${ADJUSTMENT_STATUS_LABELS[r.status]}`}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${ADJUSTMENT_STATUS_COLORS[r.status]}`}>
        {ADJUSTMENT_STATUS_LABELS[r.status]}
      </span>
    ),
  },
  { key: 'adjustmentDate', label: 'Fecha', render: (_, r) => <span title="Fecha del ajuste">{new Date(r.adjustmentDate).toLocaleDateString('es')}</span> },
  { key: 'lines', label: 'Productos', render: (_, r) => <span title="Número de líneas">{r.lines.length}</span> },
];

interface Options {
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

export function useAdjustmentColumns({ onConfirm, onCancel, onDelete }: Options) {
  const columns = useMemo(() => COLS, []);
  const actions = useMemo<TableAction<Adjustment>[]>(() => [
    { icon: CheckCircle2, title: 'Confirmar ajuste', onClick: (r) => onConfirm(r.id), hidden: (r) => r.status !== 'DRAFT' },
    { icon: XCircle, title: 'Cancelar ajuste', onClick: (r) => onCancel(r.id), hidden: (r) => r.status !== 'DRAFT' },
    { icon: Trash2, title: 'Eliminar ajuste', onClick: (r) => onDelete(r.id), hidden: (r) => r.status !== 'DRAFT' },
  ], [onConfirm, onCancel, onDelete]);
  return { columns, actions };
}
