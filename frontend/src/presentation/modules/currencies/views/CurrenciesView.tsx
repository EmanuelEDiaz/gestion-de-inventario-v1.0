'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCurrenciesController } from '../hooks/useCurrenciesController';
import { CurrencyTable } from '../components/table/CurrencyTable';
import { CurrencyFormFields } from '../components/form/CurrencyFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';

export function CurrenciesView() {
  const { currencies, isLoading, error, create, update, isCreating } = useCurrenciesController();
  const [showForm, setShowForm] = useState(false);

  const handleToggle = (code: string, isActive: boolean) => {
    update({ code, data: { isActive } });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Moneda</CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyFormFields
              onSubmit={async (data) => {
                try {
                  await create(data);
                  setShowForm(false);
                  toast.success('Moneda creada correctamente');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Error al crear moneda');
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
          <CardTitle>Monedas</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} title="Agregar nueva moneda">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Moneda
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <CurrencyTable currencies={currencies} onToggle={handleToggle} />
        </CardContent>
      </Card>
    </div>
  );
}
