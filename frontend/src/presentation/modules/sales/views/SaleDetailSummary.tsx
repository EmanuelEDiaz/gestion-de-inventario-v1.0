'use client';

import type { Sale } from '@/core/sale/entities/sale';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface SaleDetailSummaryProps {
  sale: Sale;
}

export function SaleDetailSummary({ sale }: SaleDetailSummaryProps) {
  return (
    <div className="flex justify-end">
      <div className="w-64 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span>{formatCurrency(sale.subtotal, sale.currencyCode)}</span>
        </div>
        {sale.discountAmount > 0 && (
          <div className="flex justify-between text-danger">
            <span>Descuento</span>
            <span>-{formatCurrency(sale.discountAmount, sale.currencyCode)}</span>
          </div>
        )}
        {sale.taxAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Impuesto</span>
            <span>{formatCurrency(sale.taxAmount, sale.currencyCode)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t pt-1">
          <span>Total</span>
          <span>{formatCurrency(sale.total, sale.currencyCode)}</span>
        </div>
      </div>
    </div>
  );
}
