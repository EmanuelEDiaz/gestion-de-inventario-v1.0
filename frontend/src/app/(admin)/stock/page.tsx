'use client';

import { useStock } from '@/presentation/modules/stock';
import { StockBalanceTable } from '@/presentation/modules/stock';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';

export default function StockPage() {
  const { balances, isLoading, error } = useStock();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Stock</h1>
      {isLoading && <LoadingSpinner />}
      {error && <AlertMessage variant="error" message={error} />}
      {!isLoading && !error && (
        <Card>
          <CardHeader><CardTitle>Balances de Inventario</CardTitle></CardHeader>
          <CardContent>
            <StockBalanceTable balances={balances} showWarehouse showProduct />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
