'use client';

import type { Product } from '@/core/entities/product';
import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Trash2 } from 'lucide-react';

interface SaleLineInput {
  productId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
}

interface SaleItemRowProps {
  line: SaleLineInput;
  index: number;
  products: Product[];
  showLabels: boolean;
  onUpdate: (index: number, field: keyof SaleLineInput, value: string) => void;
  onRemove: (index: number) => void;
  isRemoveDisabled: boolean;
}

export function SaleItemRow({ line, index, products, showLabels, onUpdate, onRemove, isRemoveDisabled }: SaleItemRowProps) {
  return (
    <div className="grid grid-cols-[1fr_80px_100px_80px_40px] gap-2 items-end">
      <div className="space-y-1">
        {showLabels && <label className="text-xs text-muted-foreground">Producto</label>}
        <ComboboxSelect
          options={products.map((p) => ({ value: p.id, label: p.sku ? `${p.sku} - ${p.name}` : p.name }))}
          value={line.productId}
          onChange={(val) => onUpdate(index, 'productId', val)}
          placeholder={products.length === 0 ? 'No hay productos' : 'Seleccionar...'}
        />
      </div>
      <div className="space-y-1">
        {showLabels && <label className="text-xs text-muted-foreground">Cant.</label>}
        <Input
          type="number"
          min="1"
          value={line.quantity}
          onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
          required
          title="Cantidad"
        />
      </div>
      <div className="space-y-1">
        {showLabels && <label className="text-xs text-muted-foreground">Precio</label>}
        <Input
          type="number"
          step="0.01"
          min="0"
          value={line.unitPrice}
          onChange={(e) => onUpdate(index, 'unitPrice', e.target.value)}
          required
          title="Precio unitario"
        />
      </div>
      <div className="space-y-1">
        {showLabels && <label className="text-xs text-muted-foreground">Desc.</label>}
        <Input
          type="number"
          step="0.01"
          min="0"
          value={line.discount}
          onChange={(e) => onUpdate(index, 'discount', e.target.value)}
          title="Descuento"
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-2 text-red-500 hover:text-red-700"
        title="Eliminar línea"
        disabled={isRemoveDisabled}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
