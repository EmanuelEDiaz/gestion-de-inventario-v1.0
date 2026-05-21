'use client';

import type { CartLine } from '../hooks/usePosCart';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface SaleSummaryPanelProps {
  lines: CartLine[];
  currencyCode: string;
}

export function SaleSummaryPanel({ lines, currencyCode }: SaleSummaryPanelProps) {
  return (
    <div className="px-5 py-3 space-y-1 max-h-52 overflow-y-auto">
      {lines.map((l) => (
        <div key={l.productId} className="flex justify-between text-sm">
          <span className="truncate text-gray-700" title={l.productName}>
            {l.productName} × {l.quantity}
          </span>
          <span className="ml-2 font-medium shrink-0">
            {formatCurrency(l.quantity * l.unitPrice * (1 - l.discount / 100), currencyCode)}
          </span>
        </div>
      ))}
    </div>
  );
}
