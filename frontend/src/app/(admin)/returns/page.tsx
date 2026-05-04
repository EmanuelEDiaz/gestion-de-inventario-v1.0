'use client';

import { useReturns, ReturnTable } from '@/presentation/modules/returns';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';

export default function ReturnsPage() {
  const { returns, loading, error, confirm, cancel, remove } = useReturns();

  if (loading) {
    return <div className="p-6">Cargando devoluciones...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Devoluciones</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Devoluciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ReturnTable 
            returns={returns}
            onConfirm={confirm}
            onCancel={cancel}
            onDelete={remove}
          />
        </CardContent>
      </Card>
    </div>
  );
}
