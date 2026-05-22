'use client';

import { useMemo } from 'react';
import { CheckCircle, CircleOff, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import Link from 'next/link';
import type { Supplier } from '@/core/supplier/entities/supplier';
import { formatDateShort } from '@/presentation/shared/lib/utils';
import { GenericTable, type Column, type TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { statusBadge } from '@/presentation/shared/lib/colors';

interface SupplierTableProps {
  suppliers: Supplier[];
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const COLUMNS: Column<Supplier>[] = [
  { key: 'code', label: 'Código', render: (_, r) => <Link href={`/suppliers/${r.id}`} className="hover:underline text-primary font-medium">{r.code || 'N/A'}</Link> },
  { key: 'name', label: 'Nombre' },
  { key: 'phone', label: 'Teléfono', render: (_, r) => <span>{r.phone || 'N/A'}</span> },
  { key: 'email', label: 'Email', render: (_, r) => <span>{r.email || 'N/A'}</span> },
  {
    key: 'active', label: 'Estado',
    render: (_, r) => (
      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadge(r.active)}`}>
        {r.active ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
  { key: 'createdAt', label: 'Creado', render: (_, r) => <span>{formatDateShort(r.createdAt)}</span> },
];

export function SupplierTable({ suppliers, onActivate, onDeactivate, onDelete }: SupplierTableProps) {
  const actions = useMemo<TableAction<Supplier>[]>(() => [
    { icon: CheckCircle, title: 'Activar', onClick: (r) => onActivate?.(r.id), hidden: (r) => r.active || !onActivate },
    { icon: CircleOff, title: 'Desactivar', onClick: (r) => onDeactivate?.(r.id), hidden: (r) => !r.active || !onDeactivate },
    { icon: Trash2, title: 'Eliminar', onClick: (r) => onDelete?.(r.id), hidden: () => !onDelete },
  ], [onActivate, onDeactivate, onDelete]);

  return (
    <GenericTable data={suppliers} columns={COLUMNS} actions={actions}
      emptyMessage="No hay proveedores registrados" />
  );
}
