'use client';

import type { Product } from '@/core/product/entities/product';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { Trash2, Plus } from '@/presentation/shared/components/ui/icon-mapping';

interface ReturnLineInput {
  productId: string;
  quantity: string;
  unitPrice: string;
}

interface ReturnFormItemsProps {
  lines: ReturnLineInput[];
  products: Product[];
  onUpdateLine: (i: number, field: keyof ReturnLineInput, value: string) => void;
  onAddLine: () => void;
  onRemoveLine: (i: number) => void;
}

export function ReturnFormItems({
  lines, products, onUpdateLine, onAddLine, onRemoveLine,
}: ReturnFormItemsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Productos a Devolver</h3>
        <Button type="button" size="sm" variant="outline" onClick={onAddLine} title="Agregar producto"><Plus className="h-4 w-4 mr-1" /> Línea</Button>
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_100px_40px] gap-2 items-end">
            <div className="space-y-1">
              {i === 0 && <label className="text-xs text-muted-foreground">Producto</label>}
              <ComboboxSelect
                options={products.map((p) => ({ value: p.id, label: p.sku ? `${p.sku} - ${p.name}` : p.name }))}
                value={line.productId}
                onChange={(val) => onUpdateLine(i, 'productId', val)}
                placeholder={products.length === 0 ? 'No hay productos' : 'Seleccionar producto...'}
              />
            </div>
            <div className="space-y-1">
              {i === 0 && <label className="text-xs text-muted-foreground">Cant.</label>}
              <Input type="number" min="1" value={line.quantity} onChange={(e) => onUpdateLine(i, 'quantity', e.target.value)} required title="Cantidad" />
            </div>
            <div className="space-y-1">
              {i === 0 && <label className="text-xs text-muted-foreground">Precio</label>}
              <Input type="number" step="0.01" min="0" value={line.unitPrice} onChange={(e) => onUpdateLine(i, 'unitPrice', e.target.value)} required title="Precio unitario" />
            </div>
            <button type="button" onClick={() => onRemoveLine(i)} className="p-2 text-red-500 hover:text-red-700" title="Eliminar" disabled={lines.length === 1}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
