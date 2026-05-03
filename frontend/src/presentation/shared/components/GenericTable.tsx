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
      <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-white shadow', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.className,
                  column.sortable && 'cursor-pointer hover:bg-gray-50'
                )}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <div className="flex items-center gap-1">
                  <span>{column.label}</span>
                  {column.sortable && sortKey === column.key && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
            {actions.length > 0 && (
              <TableHead className="text-right">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) => {
                const value = getValue(row, column.key);
                return (
                  <TableCell key={column.key} className={column.className}>
                    {column.render
                      ? column.render(value, row)
                      : String(value ?? '-')}
                  </TableCell>
                );
              })}
              {actions.length > 0 && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {actions.map((action, idx) => (
                      <IconButton
                        key={idx}
                        icon={action.icon}
                        title={action.title}
                        href={action.href?.(row)}
                        onClick={action.onClick ? () => action.onClick!(row) : undefined}
                        size="sm"
                      />
                    ))}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}