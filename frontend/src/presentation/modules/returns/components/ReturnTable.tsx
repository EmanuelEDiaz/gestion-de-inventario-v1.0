'use client';

import { useMemo } from 'react';
import { CheckCircle, XCircle, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import type { Return } from '@/core/return/entities/return';
import { RETURN_STATUS_LABELS, RETURN_STATUS_COLORS, RETURN_TYPE_LABELS } from '@/core/return/entities/return';
import { formatDateShort, formatCurrency } from '@/presentation/shared/lib/utils';
import { GenericTable, type Column, type TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { Badge } from '@/presentation/shared/components/ui/badge';

interface ReturnTableProps {
  returns: Return[];
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const COLUMNS: Column<Return>[] = [
  { key: 'returnNumber', label: 'Número', render: (_, r) => <span className="font-medium">{r.returnNumber}</span> },
  { key: 'type', label: 'Tipo', render: (_, r) => <span>{RETURN_TYPE_LABELS[r.type]}</span> },
  { key: 'warehouseName', label: 'Almacén', render: (_, r) => <span>{r.warehouseName || 'N/A'}</span> },
  {
    key: 'status', label: 'Estado',
    render: (_, r) => (
      <Badge className={RETURN_STATUS_COLORS[r.status]}>
        {RETURN_STATUS_LABELS[r.status]}
      </Badge>
    ),
  },
  { key: 'returnDate', label: 'Fecha', render: (_, r) => <span>{formatDateShort(r.returnDate)}</span> },
  { key: 'lines', label: 'Productos', render: (_, r) => <span>{r.lines.length} producto(s)</span> },
  { key: 'totalAmount', label: 'Total', className: 'text-right', render: (_, r) => <span>{formatCurrency(r.totalAmount)}</span> },
];

export function ReturnTable({ returns, onConfirm, onCancel, onDelete }: ReturnTableProps) {
  const actions = useMemo<TableAction<Return>[]>(() => [
    { icon: CheckCircle, title: 'Confirmar', onClick: (r) => onConfirm?.(r.id), hidden: (r) => !onConfirm || r.status !== 'DRAFT' },
    { icon: XCircle, title: 'Cancelar', onClick: (r) => onCancel?.(r.id), hidden: (r) => !onCancel || r.status !== 'DRAFT' },
    { icon: Trash2, title: 'Eliminar', onClick: (r) => onDelete?.(r.id), hidden: (r) => !onDelete || (r.status !== 'DRAFT' && r.status !== 'CANCELLED') },
  ], [onConfirm, onCancel, onDelete]);

  return (
    <GenericTable data={returns} columns={COLUMNS} actions={actions}
      emptyMessage="No hay devoluciones registradas" />
  );
}
