'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Pencil, Power } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui';
import { PageHeader } from '@/presentation/shared/components/PageHeader';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { LoadingOverlay } from '@/presentation/shared/components/LoadingSpinner';
import { GenericTable } from '@/presentation/shared/components/GenericTable';
import type { Column, TableAction } from '@/presentation/shared/components/GenericTable';
import { useWarehousesController } from '../hooks/useWarehousesController';
import type { Warehouse } from '@/core/entities/warehouse';
import { statusBadge } from '@/presentation/shared/lib/colors';

const COLUMNS: Column<Warehouse>[] = [
  { key: 'code', label: 'Código', render: (_, r) => <span className="font-mono font-medium" title="Código del almacén">{r.code}</span> },
  { key: 'name', label: 'Nombre', render: (_, r) => <span title="Nombre del almacén">{r.name}</span> },
  { key: 'address', label: 'Dirección', render: (_, r) => <span title="Dirección del almacén">{r.address ?? '—'}</span> },
  {
    key: 'active', label: 'Estado',
    render: (_, r) => (
      <span title={r.active ? 'Almacén activo' : 'Almacén inactivo'}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadge(r.active)}`}>
        {r.active ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

export function WarehousesListView() {
  const { warehouses, isLoading, error, showInactive, toggleShowInactive, toggleWarehouseStatus, clearError } = useWarehousesController();

  const actions = useMemo<TableAction<Warehouse>[]>(() => [
    { icon: Pencil, title: 'Editar almacén', href: (r) => `/warehouses/${r.id}` },
    { icon: Power, title: 'Activar/desactivar almacén', onClick: (r: Warehouse) => toggleWarehouseStatus(r.id) },
  ], [toggleWarehouseStatus]);

  return (
    <div className="space-y-6">
      <PageHeader title="Almacenes" description="Gestiona los almacenes del sistema"
        actions={<Link href="/warehouses/new"><Button title="Crear nuevo almacén">+ Nuevo Almacén</Button></Link>}
      />
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer" title="Mostrar almacenes inactivos">
        <input type="checkbox" checked={showInactive} onChange={(e) => toggleShowInactive(e.target.checked)} className="rounded border-gray-300" />
        Mostrar inactivos
      </label>
      {error && <AlertMessage message={error} onDismiss={clearError} />}
      {isLoading && <LoadingOverlay />}
      {!isLoading && (
        <GenericTable data={warehouses} columns={COLUMNS} actions={actions} emptyMessage="No hay almacenes registrados" />
      )}
    </div>
  );
}

