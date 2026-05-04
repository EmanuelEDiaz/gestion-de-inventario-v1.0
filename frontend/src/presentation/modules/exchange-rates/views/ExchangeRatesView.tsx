'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useExchangeRatesController } from '../hooks/useExchangeRatesController';
import { ExchangeRateTable } from '../components/table/ExchangeRateTable';
import { ExchangeRateFormFields } from '../components/form/ExchangeRateFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';

export function ExchangeRatesView() {
  const { rates, isLoading, error, create, isCreating } = useExchangeRatesController();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nueva Tasa de Cambio</CardTitle></CardHeader>
          <CardContent>
            <ExchangeRateFormFields
              onSubmit={async (data) => {
                try {
                  await create(data);
                  setShowForm(false);
                  toast.success('Tasa de cambio registrada correctamente');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Error al registrar tasa de cambio');
                }
              }}
              isSubmitting={isCreating}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasas de Cambio</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} title="Registrar nueva tasa de cambio">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tasa
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ExchangeRateTable rates={rates} />
        </CardContent>
      </Card>
    </div>
  );
}
