'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/presentation/shared/lib/utils';
import { Table } from '../ui/table';
import { Button } from '../ui/Button';
import { GenericTableHeader } from './GenericTableHeader';
import { GenericTableBody } from './GenericTableBody';
import { useTableSelection } from '@/presentation/shared/hooks/useTableSelection';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  className?: string;
}

export interface TableAction<T> {
  icon: LucideIcon;
  title?: string;
  onClick?: (row: T) => void;
  href?: (row: T) => string;
}

export interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: TableAction<T>[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onDeleteSelected?: (ids: string[]) => void;
}

export function GenericTable<T extends { id: string }>({
  data, columns, actions = [], onSort, sortKey, sortDirection,
  emptyMessage = 'No hay datos para mostrar', className, onRowClick,
  selectable = false, onDeleteSelected,
}: GenericTableProps<T>) {
  const allIds = data.map((r) => r.id);
  const { selectedIds, toggleOne, toggleAll, clearSelection, isAllSelected, isIndeterminate } =
    useTableSelection(allIds);

  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-card p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('relative w-full space-y-2', className)}>
      {selectable && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-muted bg-muted/30 px-4 py-2">
          <span className="text-sm text-muted-foreground" title="Cantidad de filas seleccionadas">
            {selectedIds.size} seleccionado(s)
          </span>
          {onDeleteSelected && (
            <Button variant="destructive" size="sm"
              onClick={() => { onDeleteSelected([...selectedIds]); clearSelection(); }}
              title="Eliminar los elementos seleccionados">
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Eliminar seleccionados
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearSelection} title="Cancelar selección">
            Cancelar
          </Button>
        </div>
      )}
      <div className="relative w-full overflow-x-auto rounded-xl bg-card shadow-sm">
        <Table>
          <GenericTableHeader
            columns={columns} actions={actions} selectable={selectable}
            isAllSelected={isAllSelected} isIndeterminate={isIndeterminate}
            onToggleAll={toggleAll} onSort={onSort} sortKey={sortKey} sortDirection={sortDirection}
          />
          <GenericTableBody
            data={data} columns={columns} actions={actions} selectable={selectable}
            selectedIds={selectedIds} onToggleOne={toggleOne} onRowClick={onRowClick}
          />
        </Table>
      </div>
    </div>
  );
}