'use client';

import { useMovements } from '@/presentation/modules/movements';
import { MovementTable } from '@/presentation/modules/movements';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';

export default function MovementsPage() {
  const { movements, isLoading, error } = useMovements();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Movimientos</h1>
      {isLoading && <LoadingSpinner />}
      {error && <AlertMessage variant="error" message={error} />}
      {!isLoading && !error && (
        <Card>
          <CardHeader><CardTitle>Historial de Movimientos</CardTitle></CardHeader>
          <CardContent>
            <MovementTable movements={movements} showWarehouse showProduct />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
