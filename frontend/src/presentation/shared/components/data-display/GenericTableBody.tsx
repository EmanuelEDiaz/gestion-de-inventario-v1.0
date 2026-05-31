'use client';

import { cn } from '@/presentation/shared/lib/utils';
import { TableBody, TableCell, TableRow } from '../ui/table';
import { IconButton } from '../form/IconButton';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import type { Column, TableAction } from './GenericTable';

function getValue(row: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((val, k) => {
    if (val && typeof val === 'object' && k in (val as Record<string, unknown>)) {
      return (val as Record<string, unknown>)[k];
    }
    return undefined;
  }, row);
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  actions: TableAction<T>[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleOne?: (id: string) => void;
  onRowClick?: (row: T) => void;
}

export function GenericTableBody<T extends { id: string }>({
  data, columns, actions, selectable, selectedIds, onToggleOne, onRowClick,
}: Props<T>) {
  return (
    <TableBody>
      {data.map((row) => (
        <TableRow key={row.id}
          className={cn('group border-b border-muted/50 transition-colors duration-150 hover:bg-muted/50', onRowClick && 'cursor-pointer')}
          onClick={() => onRowClick?.(row)}>
          {selectable && (
            <TableCell className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
              <TooltipWrapper content="Seleccionar fila">
                <input
                  type="checkbox" checked={selectedIds?.has(row.id) ?? false}
                  onChange={() => onToggleOne?.(row.id)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300"
                />
              </TooltipWrapper>
            </TableCell>
          )}
          {columns.map((col) => (
            <TableCell key={col.key} className={cn('px-4 py-3.5 text-sm text-center', col.className)}>
              {col.render ? col.render(getValue(row, col.key), row) : String(getValue(row, col.key) ?? '-')}
            </TableCell>
          ))}
          {actions.length > 0 && (
            <TableCell className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
              <div className={cn('flex items-center justify-center gap-1 transition-opacity duration-150', 'opacity-100 md:opacity-0 md:group-hover:opacity-100')}>
                {actions.map((action, idx) => {
                  if (action.hidden?.(row)) return null;
                  const isDelete = action.title?.toLowerCase().includes('eliminar');
                  const isEdit = action.title?.toLowerCase().includes('editar') || action.title?.toLowerCase().includes('modificar');
                  const variant = isDelete ? 'danger' : isEdit ? 'outline' : 'ghost';
                  return (
                    <IconButton key={idx} icon={action.icon} title={action.title}
                      href={action.href?.(row)}
                      onClick={action.onClick ? () => action.onClick!(row) : undefined}
                      size="sm" variant={variant}
                    />
                  );
                })}
              </div>
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  );
}
