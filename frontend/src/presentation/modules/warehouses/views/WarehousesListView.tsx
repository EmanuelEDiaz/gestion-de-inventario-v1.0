'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Pencil, Power } from '@/presentation/shared/components/ui/icon-mapping';
import { Button } from '@/presentation/shared/components/ui';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { LoadingOverlay } from '@/presentation/shared/components/form/LoadingSpinner';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { useWarehousesController } from '../hooks/useWarehousesController';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
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
        actions={<TooltipWrapper content="Crear nuevo almacén" side="top"><Link href="/warehouses/new"><Button>+ Nuevo Almacén</Button></Link></TooltipWrapper>}
      />
      <TooltipWrapper content="Mostrar/ocultar almacenes inactivos" side="top">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={(e) => toggleShowInactive(e.target.checked)} className="rounded border-gray-300" />
          Mostrar inactivos
        </label>
      </TooltipWrapper>
      {error && <AlertMessage message={error} onDismiss={clearError} />}
      {isLoading && <LoadingOverlay />}
      {!isLoading && (
        <GenericTable data={warehouses} columns={COLUMNS} actions={actions} emptyMessage="No hay almacenes registrados" />
      )}
    </div>
  );
}

