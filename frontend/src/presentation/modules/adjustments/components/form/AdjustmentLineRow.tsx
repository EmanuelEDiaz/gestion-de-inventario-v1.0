'use client';

import type { Product } from '@/core/product/entities/product';
import { Input } from '@/presentation/shared/components/ui/Input';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { Trash2 } from '@/presentation/shared/components/ui/icon-mapping';

interface AdjustmentLineInput {
  productId: string;
  systemQty: string;
  countedQty: string;
}

interface AdjustmentLineRowProps {
  line: AdjustmentLineInput;
  index: number;
  products: Product[];
  onUpdate: (index: number, field: keyof AdjustmentLineInput, value: string) => void;
  onRemove: (index: number) => void;
  isOnlyLine: boolean;
}

export function AdjustmentLineRow({ line, index, products, onUpdate, onRemove, isOnlyLine }: AdjustmentLineRowProps) {
  return (
    <div className="grid grid-cols-[1fr_80px_80px_40px] gap-2 items-end">
      <div className="space-y-1">
        {index === 0 && <label className="text-xs text-muted-foreground">Producto</label>}
        <ComboboxSelect
          options={products.map((p) => ({ value: p.id, label: p.sku ? `${p.sku} - ${p.name}` : p.name }))}
          value={line.productId}
          onChange={(val) => onUpdate(index, 'productId', val)}
          placeholder={products.length === 0 ? 'No hay productos' : 'Seleccionar producto...'}
        />
      </div>
      <div className="space-y-1">
        {index === 0 && <label className="text-xs text-muted-foreground">Sistema</label>}
        <Input type="number" min="0" value={line.systemQty} onChange={(e) => onUpdate(index, 'systemQty', e.target.value)} required title="Cantidad en sistema" />
      </div>
      <div className="space-y-1">
        {index === 0 && <label className="text-xs text-muted-foreground">Conteo</label>}
        <Input type="number" min="0" value={line.countedQty} onChange={(e) => onUpdate(index, 'countedQty', e.target.value)} required title="Cantidad contada" />
      </div>
      <button type="button" onClick={() => onRemove(index)} className="p-2 text-red-500 hover:text-red-700" title="Eliminar" disabled={isOnlyLine}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
