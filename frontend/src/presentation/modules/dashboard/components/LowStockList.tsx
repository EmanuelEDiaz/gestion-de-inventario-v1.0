'use client';

import type { LowStockItem } from '@/core/dashboard/entities/dashboard';
import { AlertTriangle } from '@/presentation/shared/components/ui/icon-mapping';

interface LowStockListProps {
  items: LowStockItem[];
}

export function LowStockList({ items }: LowStockListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Todos los productos tienen stock suficiente
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {items.map(item => (
        <li key={`${item.productId}-${item.warehouseId}`} className="flex items-center gap-3 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-500" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{item.productName}</p>
            <p className="text-xs text-gray-500">SKU: {item.productSku}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-red-600">{item.onHand}</p>
            <p className="text-xs text-gray-400">mín: {item.reorderPoint}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
