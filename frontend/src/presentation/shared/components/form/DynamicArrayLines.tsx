'use client';

import type { ReactNode } from 'react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { Plus, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';

export interface Column {
  key: string;
  label: string;
  type: 'product' | 'number';
  placeholder?: string;
  min?: number;
  step?: string;
}

export interface DynamicArrayLinesProps {
  lines: Record<string, string>[];
  products: Array<{ id: string; name: string; sku?: string | null }>;
  columns: Column[];
  fieldErrors?: Record<string, string>;
  onUpdate: (index: number, field: string, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  sectionTitle?: string;
  addButtonLabel?: string;
  renderActions?: (index: number) => ReactNode;
}

export function DynamicArrayLines({
  lines,
  products,
  columns,
  fieldErrors,
  onUpdate,
  onAdd,
  onRemove,
  sectionTitle = 'Líneas',
  addButtonLabel = 'Línea',
  renderActions,
}: DynamicArrayLinesProps) {
  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.sku ? `${p.sku} - ${p.name}` : p.name,
  }));

  const colWidths = columns.map((col) =>
    col.type === 'product' ? 'minmax(140px,1fr)' : '80px',
  );
  const removeWidth = renderActions ? 'auto' : '40px';
  const gridTemplateColumns = [...colWidths, removeWidth].join(' ');

  function getFieldError(i: number, key: string): string | undefined {
    return fieldErrors?.[`lines.${i}.${key}`] ?? fieldErrors?.[`${i}.${key}`];
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{sectionTitle}</h3>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> {addButtonLabel}
        </Button>
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div
            key={i}
            className="grid gap-2 items-end"
            style={{ gridTemplateColumns }}
          >
            {columns.map((col) => {
              const error = getFieldError(i, col.key);

              if (col.type === 'product') {
                return (
                  <div key={col.key} className="space-y-1">
                    {i === 0 && (
                      <label className="text-xs text-muted-foreground">
                        {col.label}
                      </label>
                    )}
                    <ComboboxSelect
                      options={productOptions}
                      value={line[col.key] ?? ''}
                      onChange={(val) => onUpdate(i, col.key, val)}
                      placeholder={
                        products.length === 0
                          ? 'No hay productos'
                          : col.placeholder ?? 'Seleccionar...'
                      }
                      error={error}
                    />
                  </div>
                );
              }

              return (
                <div key={col.key} className="space-y-1">
                  {i === 0 && (
                    <label className="text-xs text-muted-foreground">
                      {col.label}
                    </label>
                  )}
                  <Input
                    type="number"
                    min={col.min}
                    step={col.step}
                    value={line[col.key] ?? ''}
                    onChange={(e) => onUpdate(i, col.key, e.target.value)}
                    placeholder={col.placeholder}
                    title={col.label}
                    error={error}
                  />
                </div>
              );
            })}

            {renderActions ? (
              renderActions(i)
            ) : (
              <TooltipWrapper content="Eliminar línea">
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipWrapper>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
