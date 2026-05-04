/**
 * WarehousesListView - Composition view for warehouses list page
 */

'use client';

import Link from 'next/link';
import { Button } from '@/presentation/shared/components/ui';
import { PageHeader } from '@/presentation/shared/components/PageHeader';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { LoadingOverlay } from '@/presentation/shared/components/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/EmptyState';
import { WarehouseCard } from '../components/WarehouseCard';
import { useWarehousesController } from '../hooks/useWarehousesController';

export function WarehousesListView() {
  const {
    warehouses,
    isLoading,
    error,
    showInactive,
    toggleShowInactive,
    toggleWarehouseStatus,
    clearError,
  } = useWarehousesController();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Almacenes"
        description="Gestiona los almacenes del sistema"
        actions={
          <Link href="/warehouses/new">
            <Button>+ Nuevo Almacén</Button>
          </Link>
        }
      />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => toggleShowInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Mostrar inactivos
        </label>
      </div>

      {error && <AlertMessage message={error} onDismiss={clearError} />}

      {isLoading && <LoadingOverlay />}

      {!isLoading && warehouses.length === 0 && (
        <EmptyState
          message="No hay almacenes registrados"
          action={
            <Link href="/warehouses/new">
              <Button>Crear primer almacén</Button>
            </Link>
          }
        />
      )}

      {!isLoading && warehouses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => (
            <WarehouseCard
              key={warehouse.id}
              warehouse={warehouse}
              onToggleStatus={toggleWarehouseStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
