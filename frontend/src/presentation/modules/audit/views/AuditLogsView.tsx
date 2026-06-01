'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAuditLogsController } from '../hooks/useAuditLogsController';
import { DetailModal } from '@/presentation/shared/components/data-display/DetailModal';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { FilterBar } from '@/presentation/shared/components/ui/FilterBar';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import type { FilterDef } from '@/presentation/shared/components/ui/FilterBar';
import type { AuditLogEntry } from '@/core/audit/entities/audit-log';
import { Eye } from '@/presentation/shared/components/ui/icon-mapping';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { formatDate } from '@/presentation/shared/lib/utils';

const ACTION_STYLES: Record<string, { label: string; color: string }> = {
  CREATE:  { label: 'Creación',    color: 'text-green-700 bg-green-50' },
  UPDATE:  { label: 'Actualización', color: 'text-blue-700 bg-blue-50' },
  DELETE:  { label: 'Eliminación',  color: 'text-red-700 bg-red-50' },
  ARCHIVE: { label: 'Archivado',    color: 'text-yellow-700 bg-yellow-50' },
  ACTIVATE:{ label: 'Activación',   color: 'text-purple-700 bg-purple-50' },
};

const COLUMNS: Column<AuditLogEntry>[] = [
  { key: 'createdAt', label: 'Fecha',
    render: (_, r) => <span className="text-sm">{r.createdAt ? new Date(r.createdAt).toLocaleString('es-CU') : '—'}</span> },
  { key: 'actorName', label: 'Actor' },
  { key: 'entityType', label: 'Entidad' },
  { key: 'action', label: 'Acción',
    render: (_, r) => {
      const s = ACTION_STYLES[r.action] || { color: 'text-gray-700 bg-gray-50' };
      return (
        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${s.color}`}>
          {s.label || r.action}
        </span>
      );
    },
  },
];

const FILTER_DEFS: FilterDef[] = [
  { key: 'entityType', label: 'Entidad', type: 'select' as const,
    options: [
      { value: 'PRODUCT', label: 'Producto' },
      { value: 'SALE', label: 'Venta' },
      { value: 'PURCHASE', label: 'Compra' },
      { value: 'CATEGORY', label: 'Categoría' },
      { value: 'CUSTOMER', label: 'Cliente' },
      { value: 'SUPPLIER', label: 'Proveedor' },
      { value: 'CURRENCY', label: 'Moneda' },
      { value: 'EXCHANGE_RATE', label: 'Tasa de Cambio' },
    ] },
  { key: 'action', label: 'Acción', type: 'select' as const,
    options: [
      { value: 'CREATE', label: 'Creación' },
      { value: 'UPDATE', label: 'Actualización' },
      { value: 'DELETE', label: 'Eliminación' },
      { value: 'ARCHIVE', label: 'Archivado' },
      { value: 'ACTIVATE', label: 'Activación' },
    ] },
];

export function AuditLogsView() {
  const {
    items, isLoading, error, filter, detailItem, isDetailOpen,
    openDetail, closeDetail, updateFilter, setPage, page, totalPages, total, pageSize,
  } = useAuditLogsController();

  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleSearch = useCallback((value: string) => {
    updateFilter({ search: value || undefined });
  }, [updateFilter]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    updateFilter({ [key]: value || undefined });
  }, [updateFilter]);

  const actions = useMemo<TableAction<AuditLogEntry>[]>(() => [
    { icon: Eye, title: 'Ver detalle del cambio', onClick: (row) => openDetail(row) },
  ], [openDetail]);

  const detailSections = useMemo(() => {
    if (!detailItem) return [];
    const actionInfo = ACTION_STYLES[detailItem.action] || { label: detailItem.action, color: 'text-gray-700 bg-gray-50' };
    return [
      {
        title: 'Información General',
        fields: [
          { label: 'Actor', value: detailItem.actorName },
          { label: 'Acción', value: <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${actionInfo.color}`}>{actionInfo.label}</span> },
          { label: 'Entidad', value: detailItem.entityType },
          { label: 'ID Entidad', value: <span className="font-mono text-xs">{detailItem.entityId}</span> },
          { label: 'IP', value: detailItem.ipAddress || null, tooltip: 'Dirección IP desde donde se realizó el cambio' },
          { label: 'Fecha', value: formatDate(detailItem.createdAt) },
        ],
      },
    ];
  }, [detailItem]);

  const detailJsonSections = useMemo(() => {
    if (!detailItem) return [];
    return [
      { title: 'Estado Anterior (beforeData)', data: detailItem.beforeData, label: 'beforeData' },
      { title: 'Estado Posterior (afterData)', data: detailItem.afterData, label: 'afterData' },
    ];
  }, [detailItem]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría"
        description="Registro de cambios realizados en el sistema"
      />

      <FilterBar
        searchPlaceholder="Buscar por actor, entidad o acción..."
        onSearch={handleSearch}
        filters={FILTER_DEFS}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
      />

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded">{error}</div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState message="No hay registros de auditoría con los filtros aplicados" />
      ) : (
        <GenericTable<AuditLogEntry>
          columns={COLUMNS}
          data={items}
          actions={actions}
          emptyMessage="No hay registros de auditoría"
          pagination={{ page, totalPages, totalElements: total, onPageChange: setPage, pageSize }}
        />
      )}

      <DetailModal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        title="Detalle del Cambio"
        sections={detailSections}
        jsonSections={detailJsonSections}
      />
    </div>
  );
}
