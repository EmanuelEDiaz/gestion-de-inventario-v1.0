'use client';

import type { Product } from '@/core/product/entities/product';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Plus } from '@/presentation/shared/components/ui/icon-mapping';
import { SaleItemRow } from './SaleItemRow';

interface SaleLineInput {
  productId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
}

interface SaleLinesSectionProps {
  lines: SaleLineInput[];
  products: Product[];
  onUpdate: (index: number, field: keyof SaleLineInput, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export function SaleLinesSection({ lines, products, onUpdate, onRemove, onAdd }: SaleLinesSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Líneas de Venta</h3>
        <Button type="button" size="sm" variant="outline" onClick={onAdd} title="Agregar línea de producto">
          <Plus className="h-4 w-4 mr-1" /> Línea
        </Button>
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <SaleItemRow
            key={i}
            line={line}
            index={i}
            products={products}
            showLabels={i === 0}
            onUpdate={onUpdate}
            onRemove={onRemove}
            isRemoveDisabled={lines.length === 1}
          />
        ))}
      </div>
    </div>
  );
}
