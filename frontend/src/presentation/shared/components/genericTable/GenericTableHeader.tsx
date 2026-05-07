'use client';

import { cn } from '@/presentation/shared/lib/utils';
import { TableHead, TableHeader, TableRow } from '../ui/table';
import type { Column, TableAction } from './GenericTable';

interface SortIconProps { active: boolean; direction?: 'asc' | 'desc'; }

function SortIcon({ active, direction }: SortIconProps) {
  const d = active && direction === 'asc'
    ? 'M5 15l7-7 7 7'
    : active
      ? 'M19 9l-7 7-7-7'
      : 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4';
  return (
    <svg className={cn('h-3 w-3', !active && 'opacity-40')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

interface Props<T> {
  columns: Column<T>[];
  actions: TableAction<T>[];
  selectable?: boolean;
  isAllSelected?: boolean;
  isIndeterminate?: boolean;
  onToggleAll?: () => void;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
}

export function GenericTableHeader<T>({
  columns, actions, selectable, isAllSelected, isIndeterminate,
  onToggleAll, onSort, sortKey, sortDirection,
}: Props<T>) {
  return (
    <TableHeader>
      <TableRow className="border-b-0 bg-muted/30 hover:bg-transparent">
        {selectable && (
          <TableHead className="w-10 text-center">
            <input
              type="checkbox" checked={!!isAllSelected}
              ref={(el) => { if (el) el.indeterminate = !!isIndeterminate; }}
              onChange={onToggleAll} title="Seleccionar todos"
              className="h-4 w-4 cursor-pointer rounded border-gray-300"
            />
          </TableHead>
        )}
        {columns.map((col) => (
          <TableHead key={col.key}
            className={cn('text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground', col.className, col.sortable && 'cursor-pointer select-none hover:bg-muted/50')}
            onClick={() => col.sortable && onSort?.(col.key)}>
            <div className="flex items-center justify-center gap-1.5">
              <span>{col.label}</span>
              {col.sortable && <SortIcon active={sortKey === col.key} direction={sortDirection} />}
            </div>
          </TableHead>
        ))}
        {actions.length > 0 && (
          <TableHead className="w-24 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Acciones
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}
