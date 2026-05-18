'use client';

import { StockBalance } from '@/core/entities/stock-balance';
import { formatCurrency } from '@/presentation/shared/lib/utils';
import { Card, CardContent } from '@/presentation/shared/components/ui/card';
import { statusColors } from '@/presentation/shared/lib/colors';

interface StockBalanceCardProps {
  balance: StockBalance;
  onClick?: () => void;
}

export function StockBalanceCard({ balance, onClick }: StockBalanceCardProps) {
  const isLowStock = balance.available <= 0;

  return (
    <Card
      variant={isLowStock ? 'destructive' : 'default'}
      className="cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium">{balance.productName || 'Producto'}</h3>
            <p className="text-sm text-muted-foreground">{balance.productSku}</p>
          </div>
          {isLowStock && (
            <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors.destructive}`}>
              Stock Bajo
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <p className="text-xs text-muted-foreground">Disponible</p>
            <p className={`text-lg font-bold ${isLowStock ? 'text-danger' : ''}`}>
              {balance.available.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">En Mano</p>
            <p className="text-lg font-semibold">{balance.onHand.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reservado</p>
            <p className="text-sm">{balance.reserved.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="text-sm font-medium">
              {balance.totalValue != null ? formatCurrency(balance.totalValue) : '-'}
            </p>
          </div>
        </div>

        {balance.warehouseName && (
          <div className="mt-3 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Almacén: {balance.warehouseName}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
