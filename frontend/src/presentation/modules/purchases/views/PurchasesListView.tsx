'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { usePurchases } from '../hooks/usePurchases';
import { PurchaseTable } from '../components/PurchaseTable';
import { PurchaseFormFields } from '../components/form/PurchaseFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';

export function PurchasesListView() {
  const { purchases, isLoading, error, create, confirm, receive, cancel } = usePurchases();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nueva Compra</CardTitle></CardHeader>
          <CardContent>
            <PurchaseFormFields
              onSubmit={async (data) => {
                try {
                  const result = await create(data);
                  if (result) {
                    setShowForm(false);
                    toast.success('Compra creada correctamente');
                  }
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Error al crear compra');
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
          <CardTitle>Compras</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} title="Crear nueva compra">
              <Plus className="h-4 w-4 mr-2" />Nueva Compra
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <PurchaseTable
            purchases={purchases}
            onConfirm={(purchase) => confirm(purchase.id)}
            onReceive={(purchase) => receive(purchase.id)}
            onCancel={(purchase) => cancel(purchase.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
