'use client';

import { ShoppingCart, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface CartLineData {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface PosCartPanelProps {
  lines: CartLineData[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveLine: (productId: string) => void;
}

export function PosCartPanel({ lines, onUpdateQty, onRemoveLine }: PosCartPanelProps) {
  return (
    <>
      <h2 className="font-semibold text-gray-700 flex items-center gap-1">
        <ShoppingCart className="h-4 w-4" />
        Carrito
      </h2>
      {lines.length === 0 && <EmptyState message="Agrega productos para comenzar" />}
      <ul className="space-y-2">
        {lines.map((l) => (
          <li key={l.productId} className="flex items-center gap-2 rounded-lg border px-2 py-2">
            <span className="flex-1 text-sm truncate" title={l.productName}>{l.productName}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="w-6 h-6 rounded border text-sm font-bold hover:bg-gray-100"
                onClick={() => l.quantity > 1 ? onUpdateQty(l.productId, l.quantity - 1) : onRemoveLine(l.productId)}
                title="Reducir cantidad"
              >-</button>
              <span className="w-6 text-center text-sm">{l.quantity}</span>
              <button
                type="button"
                className="w-6 h-6 rounded border text-sm font-bold hover:bg-gray-100"
                onClick={() => onUpdateQty(l.productId, l.quantity + 1)}
                title="Aumentar cantidad"
              >+</button>
            </div>
            <span className="text-sm font-medium w-16 text-right shrink-0">
              {formatCurrency(l.quantity * l.unitPrice, 'USD')}
            </span>
            <button
              type="button"
              className="p-1 rounded hover:bg-red-50"
              onClick={() => onRemoveLine(l.productId)}
              title="Quitar producto del carrito"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
