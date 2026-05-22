'use client';

import type { Product } from '@/core/product/entities/product';
import { Input } from '@/presentation/shared/components/ui/Input';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { Trash2 } from '@/presentation/shared/components/ui/icon-mapping';

export interface PurchaseLineInput {
  productId: string;
  quantity: string;
  unitCost: string;
}

interface PurchaseItemRowProps {
  line: PurchaseLineInput;
  index: number;
  products: Product[];
  onUpdate: (i: number, field: keyof PurchaseLineInput, value: string) => void;
  onRemove: (i: number) => void;
  isOnlyLine: boolean;
}

export function PurchaseItemRow({ line, index, products, onUpdate, onRemove, isOnlyLine }: PurchaseItemRowProps) {
  return (
    <div className="grid grid-cols-[1fr_80px_100px_40px] gap-2 items-end">
      <div className="space-y-1">
        {index === 0 && <label className="text-xs text-muted-foreground">Producto</label>}
        <ComboboxSelect
          options={products.map((p) => ({ value: p.id, label: p.sku ? `${p.sku} - ${p.name}` : p.name }))}
          value={line.productId}
          onChange={(val) => onUpdate(index, 'productId', val)}
          placeholder={products.length === 0 ? 'No hay productos' : 'Seleccionar...'}
        />
      </div>
      <div className="space-y-1">
        {index === 0 && <label className="text-xs text-muted-foreground">Cant.</label>}
        <Input type="number" min="1" value={line.quantity} onChange={(e) => onUpdate(index, 'quantity', e.target.value)} required title="Cantidad" />
      </div>
      <div className="space-y-1">
        {index === 0 && <label className="text-xs text-muted-foreground">Costo</label>}
        <Input type="number" step="0.01" min="0" value={line.unitCost} onChange={(e) => onUpdate(index, 'unitCost', e.target.value)} required title="Costo unitario" />
      </div>
      <button type="button" onClick={() => onRemove(index)} className="p-2 text-red-500 hover:text-red-700" title="Eliminar línea" disabled={isOnlyLine}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
