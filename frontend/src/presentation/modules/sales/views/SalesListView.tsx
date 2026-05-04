'use client';

import { useState } from 'react';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useSales } from '../hooks/useSales';
import { SaleTable } from '../components/SaleTable';
import { SaleFormFields } from '../components/form/SaleFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';

export function SalesListView() {
  const { sales, isLoading, error, create, confirm, deliver, cancel } = useSales();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nueva Venta</CardTitle></CardHeader>
          <CardContent>
            <SaleFormFields
              onSubmit={async (data) => {
                try {
                  const result = await create(data);
                  if (result) {
                    setShowForm(false);
                    toast.success('Venta creada correctamente');
                  }
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Error al crear venta');
                }
              }}
              isSubmitting={false}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ventas</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} title="Crear nueva venta">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <SaleTable
            sales={sales}
            onConfirm={(sale) => confirm(sale.id)}
            onDeliver={(sale) => deliver(sale.id)}
            onCancel={(sale) => cancel(sale.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
