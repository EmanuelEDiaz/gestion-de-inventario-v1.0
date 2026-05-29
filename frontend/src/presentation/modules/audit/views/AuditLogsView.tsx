'use client';

import { useAuditLogsController } from '../hooks/useAuditLogsController';
import { AuditLogDetailModal } from '../components/AuditLogDetailModal';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import type { AuditLogEntry } from '@/core/audit/entities/audit-log';
import { Eye, RefreshCw } from '@/presentation/shared/components/ui/icon-mapping';
import { useMemo, useState } from 'react';

const COLUMNS: Column<AuditLogEntry>[] = [
  { key: 'createdAt', label: 'Fecha',
    render: (_, r) => <span className="text-sm">{r.createdAt ? new Date(r.createdAt).toLocaleString('es-CU') : '—'}</span> },
  { key: 'actorName', label: 'Actor' },
  { key: 'entityType', label: 'Entidad' },
  { key: 'action', label: 'Acción',
    render: (_, r) => {
      const styles: Record<string, string> = {
        CREATE: 'text-green-700 bg-green-50',
        UPDATE: 'text-blue-700 bg-blue-50',
        DELETE: 'text-red-700 bg-red-50',
        ARCHIVE: 'text-yellow-700 bg-yellow-50',
        ACTIVATE: 'text-purple-700 bg-purple-50',
      };
      return (
        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${styles[r.action] || 'text-gray-700 bg-gray-50'}`}>
          {r.action}
        </span>
      );
    },
  },
];

export function AuditLogsView() {
  const {
    items, isLoading, error, filter, detailItem, isDetailOpen,
    openDetail, closeDetail, updateFilter, nextPage, prevPage,
    page, totalPages, total, refresh, clearError,
  } = useAuditLogsController();

  const actions = useMemo<TableAction<AuditLogEntry>[]>(() => [
    { icon: Eye, title: 'Ver detalle del cambio', onClick: (row) => openDetail(row) },
  ], [openDetail]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría"
        description="Registro de cambios realizados en el sistema"
        actions={
          <button onClick={refresh}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded min-h-11">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <select
          value={filter.entityType || ''}
          onChange={e => updateFilter({ entityType: e.target.value || undefined })}
          className="border rounded px-3 py-2 text-sm min-h-11">
          <option value="">Todas las entidades</option>
          <option value="PRODUCT">Producto</option>
          <option value="SALE">Venta</option>
          <option value="PURCHASE">Compra</option>
          <option value="CATEGORY">Categoría</option>
          <option value="CUSTOMER">Cliente</option>
          <option value="SUPPLIER">Proveedor</option>
        </select>

        <select
          value={filter.action || ''}
          onChange={e => updateFilter({ action: e.target.value || undefined })}
          className="border rounded px-3 py-2 text-sm min-h-11">
          <option value="">Todas las acciones</option>
          <option value="CREATE">Creación</option>
          <option value="UPDATE">Actualización</option>
          <option value="DELETE">Eliminación</option>
          <option value="ARCHIVE">Archivado</option>
          <option value="ACTIVATE">Activación</option>
        </select>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {isLoading && items.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full" />
        </div>
      ) : (
        <GenericTable<AuditLogEntry>
          columns={COLUMNS}
          data={items}
          actions={actions}
          emptyMessage="No hay registros de auditoría"
        />
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Total: {total} registros</span>
        <div className="flex gap-2">
          <button onClick={prevPage} disabled={page === 0}
            className="px-3 py-2 border rounded text-sm min-h-11 disabled:opacity-50 hover:bg-gray-50">
            ← Anterior
          </button>
          <span className="px-3 py-2 text-sm">
            Página {page + 1} de {totalPages}
          </span>
          <button onClick={nextPage} disabled={page >= totalPages - 1}
            className="px-3 py-2 border rounded text-sm min-h-11 disabled:opacity-50 hover:bg-gray-50">
            Siguiente →
          </button>
        </div>
      </div>

      <AuditLogDetailModal entry={detailItem} isOpen={isDetailOpen} onClose={closeDetail} />
    </div>
  );
}
