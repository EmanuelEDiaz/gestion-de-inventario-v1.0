'use client';

import type { Product } from '@/core/product/entities/product';
import { AdjustmentToolbar } from './AdjustmentToolbar';
import { AdjustmentLineRow } from './AdjustmentLineRow';

interface AdjustmentLineInput {
  productId: string;
  systemQty: string;
  countedQty: string;
}

interface AdjustmentLinesSectionProps {
  lines: AdjustmentLineInput[];
  products: Product[];
  onAddLine: () => void;
  onUpdate: (index: number, field: keyof AdjustmentLineInput, value: string) => void;
  onRemove: (index: number) => void;
}

export function AdjustmentLinesSection({ lines, products, onAddLine, onUpdate, onRemove }: AdjustmentLinesSectionProps) {
  return (
    <div className="space-y-3">
      <AdjustmentToolbar onAddLine={onAddLine} />
      <div className="space-y-2">
        {lines.map((line, i) => (
          <AdjustmentLineRow
            key={i}
            line={line}
            index={i}
            products={products}
            onUpdate={onUpdate}
            onRemove={onRemove}
            isOnlyLine={lines.length === 1}
          />
        ))}
      </div>
    </div>
  );
}
