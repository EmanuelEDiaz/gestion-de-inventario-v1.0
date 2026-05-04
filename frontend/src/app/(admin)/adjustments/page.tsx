'use client';

import { useAdjustments, AdjustmentTable } from '@/presentation/modules/adjustments';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';

export default function AdjustmentsPage() {
  const { adjustments, loading, error, confirm, cancel, remove } = useAdjustments();

  if (loading) {
    return <div className="p-6">Cargando ajustes...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ajustes de Inventario</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Ajustes</CardTitle>
        </CardHeader>
        <CardContent>
          <AdjustmentTable 
            adjustments={adjustments}
            onConfirm={confirm}
            onCancel={cancel}
            onDelete={remove}
          />
        </CardContent>
      </Card>
    </div>
  );
}
