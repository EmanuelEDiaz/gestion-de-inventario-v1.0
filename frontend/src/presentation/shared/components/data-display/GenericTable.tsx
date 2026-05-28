'use client';

import { ReactNode, useEffect } from 'react';
import { SvgIcon } from '@/presentation/shared/components/ui/icon-mapping';
import { Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { cn } from '@/presentation/shared/lib/utils';
import { Table } from '../ui/table';
import { Button } from '../ui/Button';
import { GenericTableHeader } from './GenericTableHeader';
import { GenericTableBody } from './GenericTableBody';
import { useTableSelection } from '@/presentation/shared/hooks/ui/useTableSelection';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  className?: string;
}

export interface TableAction<T> {
  icon: SvgIcon;
  title?: string;
  onClick?: (row: T) => void;
  href?: (row: T) => string;
  hidden?: (row: T) => boolean;
}

export interface BulkAction<T> {
  label: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (ids: string[]) => void | Promise<void>;
  disabled?: (selectedIds: Set<string>) => boolean;
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
  bulkActions?: BulkAction<T>[];
  onSelectionChange?: (ids: string[]) => void;
}

export function GenericTable<T extends { id: string }>({
  data, columns, actions = [], onSort, sortKey, sortDirection,
  emptyMessage = 'No hay datos para mostrar', className, onRowClick,
  selectable = false, onDeleteSelected, bulkActions, onSelectionChange,
}: GenericTableProps<T>) {
  const allIds = data.map((r) => r.id);
  const { selectedIds, toggleOne, toggleAll, clearSelection, isAllSelected, isIndeterminate } =
    useTableSelection(allIds);

  useEffect(() => {
    onSelectionChange?.([...selectedIds]);
  }, [selectedIds, onSelectionChange]);

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
        <div className="flex flex-col gap-2 rounded-lg border border-muted bg-muted/30 p-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-2">
          <span className="text-sm text-muted-foreground" title="Cantidad de filas seleccionadas">
            {selectedIds.size} seleccionado(s)
          </span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            {bulkActions?.map((action, i) => (
              <Button key={i}
                variant={action.variant ?? 'default'} size="sm"
                onClick={() => { action.onClick([...selectedIds]); clearSelection(); }}
                disabled={action.disabled?.(selectedIds)}
                className="w-full min-h-[44px] sm:w-auto sm:min-h-0"
                title={action.label}>
                {action.icon && <action.icon className="mr-1 h-4 w-4" />}
                {action.label}
              </Button>
            ))}
            {onDeleteSelected && (
              <Button variant="destructive" size="sm"
                onClick={() => { onDeleteSelected([...selectedIds]); clearSelection(); }}
                className="w-full min-h-[44px] sm:w-auto sm:min-h-0"
                title="Eliminar los elementos seleccionados">
                <Trash2 className="mr-1 h-4 w-4" />
                Eliminar
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearSelection}
              className="w-full min-h-[44px] sm:w-auto sm:min-h-0"
              title="Cancelar selección">
              Cancelar
            </Button>
          </div>
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
