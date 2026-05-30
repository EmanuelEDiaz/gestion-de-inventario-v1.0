'use client';

import { useState } from 'react';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { Eye, RefreshCw, Pencil, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { DeadLetterActionModal } from './DeadLetterActionModal';
import type { DeadLetterEntry } from '@/infrastructure/storage/db';
import { useDeadLetters } from '../hooks/useDeadLetters';

type DeadLetterRow = DeadLetterEntry & { id: string };

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function truncate(str: string, max = 40): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

export function DeadLetterList() {
  const { deadLetters, loading, retry, discard, retryWithEdit } = useDeadLetters();
  const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null);
  const [selected, setSelected] = useState<DeadLetterEntry | null>(null);

  const rows: DeadLetterRow[] = deadLetters.map((dl) => ({ ...dl, id: dl.operationId }));

  const columns: Column<DeadLetterRow>[] = [
    { key: 'entityType', label: 'Entidad', className: 'capitalize' },
    { key: 'action', label: 'Acción', className: 'capitalize' },
    {
      key: 'error',
      label: 'Error',
      render: (value) => {
        const err = value as string;
        return (
          <span title={err} className="block max-w-[200px] truncate text-red-600">
            {truncate(err)}
          </span>
        );
      },
    },
    {
      key: 'rejectedAt',
      label: 'Rechazado',
      render: (value) => formatRelativeTime(value as number),
    },
    {
      key: 'retryCount',
      label: 'Reintentos',
      className: 'text-center',
    },
  ];

  const actions: TableAction<DeadLetterRow>[] = [
    {
      icon: Eye,
      title: 'Ver payload',
      onClick: (row) => {
        setSelected(row);
        setModalMode('view');
      },
    },
    {
      icon: RefreshCw,
      title: 'Reintentar',
      onClick: (row) => retry(row.operationId),
    },
    {
      icon: Pencil,
      title: 'Editar y reintentar',
      onClick: (row) => {
        setSelected(row);
        setModalMode('edit');
      },
    },
    {
      icon: Trash2,
      title: 'Descartar',
      onClick: (row) => discard(row.operationId),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <>
      <GenericTable<DeadLetterRow>
        data={rows}
        columns={columns}
        actions={actions}
        emptyMessage="No hay operaciones fallidas"
      />

      {selected && modalMode && (
        <DeadLetterActionModal
          open
          onClose={() => { setModalMode(null); setSelected(null); }}
          deadLetter={selected}
          mode={modalMode}
          onSave={retryWithEdit}
        />
      )}
    </>
  );
}
