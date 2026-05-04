'use client';

import { useState } from 'react';
import { useAdjustments } from '../hooks/useAdjustments';
import { AdjustmentTable } from '../components/AdjustmentTable';
import { AdjustmentFormFields } from '../components/form/AdjustmentFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function AdjustmentsListView() {
  const { adjustments, loading, error, create, confirm, cancel, remove } = useAdjustments();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo Ajuste</CardTitle></CardHeader>
          <CardContent>
            <AdjustmentFormFields
              onSubmit={async (data) => {
                setIsCreating(true);
                try {
                  await create(data);
                  toast.success('Ajuste creado');
                  setShowForm(false);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Error al crear ajuste');
                } finally {
                  setIsCreating(false);
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
          <CardTitle>Ajustes de Inventario</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} title="Crear nuevo ajuste">
              <Plus className="h-4 w-4 mr-2" />Nuevo Ajuste
            </Button>
          )}
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
