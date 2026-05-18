'use client';

import type { Sale } from '@/core/entities/sale';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface SaleDetailItemsProps {
  sale: Sale;
}

export function SaleDetailItems({ sale }: SaleDetailItemsProps) {
  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Producto</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Cant.</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">P.Unit.</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Dto%</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sale.lines.map((l) => (
            <tr key={l.id}>
              <td className="px-4 py-3">
                <span className="font-medium">{l.productName ?? '—'}</span>
                {l.productSku && <span className="ml-2 text-xs text-gray-400">{l.productSku}</span>}
              </td>
              <td className="px-4 py-3 text-right">{l.quantity}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(l.unitPrice, sale.currencyCode)}</td>
              <td className="px-4 py-3 text-right">{l.discount}%</td>
              <td className="px-4 py-3 text-right font-medium">{formatCurrency(l.totalPrice, sale.currencyCode)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
