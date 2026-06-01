'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { SvgIcon } from '@/presentation/shared/components/ui/icon-mapping';
import { Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { cn } from '@/presentation/shared/lib/utils';
import { Table } from '../ui/table';
import { Button } from '../ui/Button';
import { GenericTableHeader } from './GenericTableHeader';
import { GenericTableBody } from './GenericTableBody';
import { PaginationControls } from './PaginationControls';
import { useTableSelection } from '@/presentation/shared/hooks/ui/useTableSelection';
import { ConfirmDialog } from '@/presentation/shared/components/ui/ConfirmDialog';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';

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
  confirmMessage?: string | ((row: T) => string);
}

export interface BulkAction {
  label: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (ids: string[]) => void | Promise<void>;
  disabled?: (selectedIds: Set<string>) => boolean;
  confirmMessage?: string | ((count: number) => string);
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
  bulkActions?: BulkAction[];
  onSelectionChange?: (ids: string[]) => void;
  pagination?: {
    page: number;
    totalPages: number;
    totalElements: number;
    onPageChange: (page: number) => void;
    pageSize: number;
  };
}

export function GenericTable<T extends { id: string }>({
  data, columns, actions = [], onSort, sortKey, sortDirection,
  emptyMessage = 'No hay datos para mostrar', className, onRowClick,
  selectable = false, onDeleteSelected, bulkActions, onSelectionChange,
  pagination,
}: GenericTableProps<T>) {
  const allIds = data.map((r) => r.id);
  const { selectedIds, toggleOne, toggleAll, clearSelection, isAllSelected, isIndeterminate } =
    useTableSelection(allIds);

  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    onSelectionChange?.([...selectedIds]);
  }, [selectedIds, onSelectionChange]);

  const wrappedActions = useMemo(() => actions.map((action) => {
    if (!action.confirmMessage || !action.onClick) return action;

    return {
      ...action,
      onClick: (row: T) => {
        const message = typeof action.confirmMessage === 'function'
          ? action.confirmMessage(row)
          : action.confirmMessage ?? '';
        setPendingConfirm({
          title: 'Confirmar acción',
          description: message,
          variant: action.title?.toLowerCase().includes('eliminar') ? 'destructive' as const : undefined,
          onConfirm: () => {
            action.onClick!(row);
            setPendingConfirm(null);
          },
        });
      },
    };
  }), [actions]);

  const handleBulkClick = (bulkAction: BulkAction) => {
    const ids = [...selectedIds];
    if (bulkAction.confirmMessage) {
      const message = typeof bulkAction.confirmMessage === 'function'
        ? bulkAction.confirmMessage(ids.length)
        : bulkAction.confirmMessage ?? '';
      setPendingConfirm({
        title: 'Confirmar acción',
        description: message,
        variant: bulkAction.variant === 'destructive' ? 'destructive' as const : undefined,
        onConfirm: () => {
          bulkAction.onClick(ids);
          clearSelection();
          setPendingConfirm(null);
        },
      });
    } else {
      bulkAction.onClick(ids);
      clearSelection();
    }
  };

  const handleDeleteSelected = () => {
    if (!onDeleteSelected) return;
    const ids = [...selectedIds];
    setPendingConfirm({
      title: 'Eliminar elementos',
      description: `¿Estás seguro de eliminar ${ids.length} elemento(s)? Esta acción no se puede deshacer.`,
      variant: 'destructive',
      onConfirm: () => {
        onDeleteSelected(ids);
        clearSelection();
        setPendingConfirm(null);
      },
    });
  };

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
          <TooltipWrapper content="Cantidad de filas seleccionadas">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} seleccionado(s)
            </span>
          </TooltipWrapper>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            {bulkActions?.map((ba, i) => (
              <TooltipWrapper key={i} content={ba.label}>
                <Button
                  variant={ba.variant ?? 'default'} size="sm"
                  onClick={() => handleBulkClick(ba)}
                  disabled={ba.disabled?.(selectedIds)}
                  className="w-full min-h-[44px] sm:w-auto sm:min-h-0">
                  {ba.icon && <ba.icon className="mr-1 h-4 w-4" />}
                  {ba.label}
                </Button>
              </TooltipWrapper>
            ))}
            {onDeleteSelected && (
              <TooltipWrapper content="Eliminar los elementos seleccionados">
                <Button variant="destructive" size="sm"
                  onClick={handleDeleteSelected}
                  className="w-full min-h-[44px] sm:w-auto sm:min-h-0">
                  <Trash2 className="mr-1 h-4 w-4" />
                  Eliminar
                </Button>
              </TooltipWrapper>
            )}
            <TooltipWrapper content="Cancelar selección">
              <Button variant="ghost" size="sm" onClick={clearSelection}
                className="w-full min-h-[44px] sm:w-auto sm:min-h-0">
                Cancelar
              </Button>
            </TooltipWrapper>
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
            data={data} columns={columns} actions={wrappedActions} selectable={selectable}
            selectedIds={selectedIds} onToggleOne={toggleOne} onRowClick={onRowClick}
          />
        </Table>
      </div>

      <ConfirmDialog
        open={!!pendingConfirm}
        title={pendingConfirm?.title ?? ''}
        description={pendingConfirm?.description ?? ''}
        confirmLabel="Confirmar"
        variant={pendingConfirm?.variant}
        onConfirm={() => pendingConfirm?.onConfirm()}
        onCancel={() => setPendingConfirm(null)}
      />
      {pagination && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalElements={pagination.totalElements}
          onPageChange={pagination.onPageChange}
          pageSize={pagination.pageSize}
        />
      )}
    </div>
  );
}
