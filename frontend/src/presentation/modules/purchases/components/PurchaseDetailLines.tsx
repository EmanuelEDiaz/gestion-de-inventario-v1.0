'use client';

import { type Purchase } from '@/core/purchase/entities/purchase';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface PurchaseDetailLinesProps {
  purchase: Purchase;
}

export function PurchaseDetailLines({ purchase }: PurchaseDetailLinesProps) {
  return (
    <div className="border-t pt-4">
      <h3 className="font-medium mb-3">Líneas de Compra</h3>
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left p-2 text-sm">Producto</th>
            <th className="text-right p-2 text-sm">Cantidad</th>
            <th className="text-right p-2 text-sm">Costo Unit.</th>
            <th className="text-right p-2 text-sm">Total</th>
          </tr>
        </thead>
        <tbody>
          {purchase.lines.map((line) => (
            <tr key={line.id} className="border-b">
              <td className="p-2">
                <div>{line.productName || line.productId}</div>
                {line.productSku && (
                  <div className="text-xs text-muted-foreground font-mono">{line.productSku}</div>
                )}
              </td>
              <td className="p-2 text-right">{line.quantity}</td>
              <td className="p-2 text-right">{formatCurrency(line.unitCost, purchase.currencyCode)}</td>
              <td className="p-2 text-right font-medium">{formatCurrency(line.totalCost, purchase.currencyCode)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2">
            <td colSpan={3} className="p-2 text-right font-medium">Subtotal</td>
            <td className="p-2 text-right">{formatCurrency(purchase.subtotal, purchase.currencyCode)}</td>
          </tr>
          {purchase.taxAmount > 0 && (
            <tr>
              <td colSpan={3} className="p-2 text-right font-medium">Impuestos</td>
              <td className="p-2 text-right">{formatCurrency(purchase.taxAmount, purchase.currencyCode)}</td>
            </tr>
          )}
          <tr>
            <td colSpan={3} className="p-2 text-right font-bold text-lg">Total</td>
            <td className="p-2 text-right font-bold text-lg">{formatCurrency(purchase.total, purchase.currencyCode)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
