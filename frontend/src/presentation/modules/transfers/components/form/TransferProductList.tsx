'use client';

import type { Product } from '@/core/product/entities/product';
import { Button, TooltipWrapper } from '@/presentation/shared/components/ui';
import { Input } from '@/presentation/shared/components/ui/Input';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { Trash2, Plus } from '@/presentation/shared/components/ui/icon-mapping';

interface TransferLineInput {
  productId: string;
  quantity: string;
}

interface TransferProductListProps {
  products: Product[];
  lines: TransferLineInput[];
  onUpdateLine: (i: number, field: keyof TransferLineInput, value: string) => void;
  onAddLine: () => void;
  onRemoveLine: (i: number) => void;
}

export function TransferProductList({ products, lines, onUpdateLine, onAddLine, onRemoveLine }: TransferProductListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Productos a Transferir</h3>
        <TooltipWrapper content="Agregar producto a la transferencia">
          <Button type="button" size="sm" variant="outline" onClick={onAddLine}><Plus className="h-4 w-4 mr-1" /> Línea</Button>
        </TooltipWrapper>
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_40px] gap-2 items-end">
            <div className="space-y-1">
              {i === 0 && <label className="text-xs text-muted-foreground">Producto</label>}
              <ComboboxSelect
                options={products.map((p) => ({ value: p.id, label: p.sku ? `${p.sku} - ${p.name}` : p.name }))}
                value={line.productId}
                onChange={(val) => onUpdateLine(i, 'productId', val)}
                placeholder={products.length === 0 ? 'No hay productos' : 'Seleccionar...'}
              />
            </div>
            <div className="space-y-1">
              {i === 0 && <label className="text-xs text-muted-foreground">Cant.</label>}
              <Input type="number" min="1" value={line.quantity} onChange={(e) => onUpdateLine(i, 'quantity', e.target.value)} required title="Cantidad" />
            </div>
            <TooltipWrapper content="Eliminar línea">
              <button type="button" onClick={() => onRemoveLine(i)} className="p-2 text-red-500 hover:text-red-700" disabled={lines.length === 1}>
              <Trash2 className="h-4 w-4" />
            </button>
            </TooltipWrapper>
          </div>
        ))}
      </div>
    </div>
  );
}
