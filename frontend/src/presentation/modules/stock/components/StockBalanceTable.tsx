'use client';

import { StockBalance } from '@/core/entities/stock-balance';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface StockBalanceTableProps {
  balances: StockBalance[];
  showWarehouse?: boolean;
  showProduct?: boolean;
  onRowClick?: (balance: StockBalance) => void;
}

export function StockBalanceTable({ 
  balances, 
  showWarehouse = true,
  showProduct = true,
  onRowClick 
}: StockBalanceTableProps) {
  if (balances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay balances de stock disponibles
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            {showWarehouse && <th className="text-left p-3 font-medium">Almacén</th>}
            {showProduct && <th className="text-left p-3 font-medium">Producto</th>}
            <th className="text-left p-3 font-medium">SKU</th>
            <th className="text-right p-3 font-medium">Disponible</th>
            <th className="text-right p-3 font-medium">Reservado</th>
            <th className="text-right p-3 font-medium">En Mano</th>
            <th className="text-right p-3 font-medium">Costo Prom.</th>
            <th className="text-right p-3 font-medium">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((balance, idx) => {
            const isLowStock = balance.available <= 0;
            return (
              <tr 
                key={`${balance.warehouseId}-${balance.productId}`}
                className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${
                  isLowStock ? 'bg-red-50 dark:bg-red-950/20' : ''
                }`}
                onClick={() => onRowClick?.(balance)}
              >
                {showWarehouse && (
                  <td className="p-3">{balance.warehouseName || balance.warehouseId}</td>
                )}
                {showProduct && (
                  <td className="p-3">{balance.productName || balance.productId}</td>
                )}
                <td className="p-3 font-mono text-sm">{balance.productSku || '-'}</td>
                <td className={`p-3 text-right font-medium ${isLowStock ? 'text-red-600' : ''}`}>
                  {balance.available.toFixed(2)}
                </td>
                <td className="p-3 text-right text-muted-foreground">
                  {balance.reserved.toFixed(2)}
                </td>
                <td className="p-3 text-right">
                  {balance.onHand.toFixed(2)}
                </td>
                <td className="p-3 text-right">
                  {balance.avgCost != null ? formatCurrency(balance.avgCost) : '-'}
                </td>
                <td className="p-3 text-right font-medium">
                  {balance.totalValue != null ? formatCurrency(balance.totalValue) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
