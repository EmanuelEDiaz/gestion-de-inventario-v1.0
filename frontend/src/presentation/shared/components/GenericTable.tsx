'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/presentation/shared/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { IconButton } from './IconButton';

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
}

export function GenericTable<T extends { id: string }>({
  data,
  columns,
  actions = [],
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'No hay datos para mostrar',
  className,
  onRowClick,
}: GenericTableProps<T>) {
  const getValue = (row: T, key: string): unknown => {
    const keys = key.split('.');
    let value: unknown = row;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return value;
  };

  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-card p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('relative w-full rounded-xl bg-card shadow-sm', className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-0 bg-muted/30 hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    'text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                    column.className,
                    column.sortable && 'cursor-pointer select-none hover:bg-muted/50'
                  )}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className={cn(
                        'text-muted-foreground/70 transition-transform duration-200',
                        sortKey === column.key ? 'text-foreground' : 'opacity-0 group-hover:opacity-50'
                      )}>
                        {sortKey === column.key && sortDirection === 'asc' ? (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : sortKey === column.key ? (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        ) : (
                          <svg className="h-3 w-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-24">
                  Acciones
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  'group border-b border-muted/50 transition-colors duration-150',
                  'hover:bg-muted/50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => {
                  const value = getValue(row, column.key);
                  return (
                    <TableCell key={column.key} className={cn('py-3.5 px-4 text-sm', column.className)}>
                      {column.render
                        ? column.render(value, row)
                        : String(value ?? '-')}
                    </TableCell>
                  );
                })}
                {actions.length > 0 && (
                  <TableCell
                    className="py-3.5 px-4 text-center"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className={cn(
                      'flex items-center justify-center gap-1 transition-opacity duration-150',
                      'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                    )}>
                      {actions.map((action, idx) => {
                        const isDelete = action.title?.toLowerCase().includes('eliminar') || action.title?.toLowerCase().includes('delete');
                        const isEdit = action.title?.toLowerCase().includes('modificar') || action.title?.toLowerCase().includes('edit') || action.title?.toLowerCase().includes('editar');
                        const variant = isDelete ? 'danger' : isEdit ? 'outline' : 'ghost';
                        return (
                          <IconButton
                            key={idx}
                            icon={action.icon}
                            title={action.title}
                            href={action.href?.(row)}
                            onClick={action.onClick ? () => action.onClick!(row) : undefined}
                            size="sm"
                            variant={variant}
                          />
                        );
                      })}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}