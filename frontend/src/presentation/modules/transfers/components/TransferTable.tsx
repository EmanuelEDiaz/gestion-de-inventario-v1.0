'use client';

import { useMemo } from 'react';
import { CheckCircle2, Truck, PackageCheck, XCircle, Trash2 } from 'lucide-react';
import type { Transfer } from '@/core/entities/transfer';
import { TRANSFER_STATUS_LABELS, TRANSFER_STATUS_COLORS } from '@/core/entities/transfer';
import { formatDateShort } from '@/presentation/shared/lib/utils';
import { GenericTable, type Column, type TableAction } from '@/presentation/shared/components/GenericTable';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface TransferTableProps {
  transfers: Transfer[];
  onConfirm?: (id: string) => void;
  onShip?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const COLUMNS: Column<Transfer>[] = [
  { key: 'transferNumber', label: 'Número', render: (_, r) => <span className="font-medium">{r.transferNumber}</span> },
  {
    key: 'fromWarehouseName', label: 'Origen → Destino',
    render: (_, r) => (
      <div className="flex items-center gap-2">
        <span>{r.fromWarehouseName || 'N/A'}</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <span>{r.toWarehouseName || 'N/A'}</span>
      </div>
    ),
  },
  {
    key: 'status', label: 'Estado',
    render: (_, r) => (
      <Badge className={TRANSFER_STATUS_COLORS[r.status]}>
        {TRANSFER_STATUS_LABELS[r.status]}
      </Badge>
    ),
  },
  { key: 'transferDate', label: 'Fecha', render: (_, r) => <span>{formatDateShort(r.transferDate)}</span> },
  { key: 'lines', label: 'Productos', render: (_, r) => <span>{r.lines.length} producto(s)</span> },
];

export function TransferTable({ transfers, onConfirm, onShip, onComplete, onCancel, onDelete }: TransferTableProps) {
  const actions = useMemo<TableAction<Transfer>[]>(() => [
    { icon: CheckCircle2, title: 'Confirmar', onClick: (r) => onConfirm?.(r.id), hidden: (r) => r.status !== 'DRAFT' || !onConfirm },
    { icon: Truck, title: 'Enviar', onClick: (r) => onShip?.(r.id), hidden: (r) => r.status !== 'CONFIRMED' || !onShip },
    { icon: PackageCheck, title: 'Completar', onClick: (r) => onComplete?.(r.id), hidden: (r) => r.status !== 'IN_TRANSIT' || !onComplete },
    { icon: XCircle, title: 'Cancelar', onClick: (r) => onCancel?.(r.id), hidden: (r) => r.status === 'COMPLETED' || r.status === 'CANCELLED' || !onCancel },
    { icon: Trash2, title: 'Eliminar', onClick: (r) => onDelete?.(r.id), hidden: (r) => r.status !== 'DRAFT' || !onDelete },
  ], [onConfirm, onShip, onComplete, onCancel, onDelete]);

  return (
    <GenericTable data={transfers} columns={COLUMNS} actions={actions}
      emptyMessage="No hay transferencias registradas" />
  );
}
