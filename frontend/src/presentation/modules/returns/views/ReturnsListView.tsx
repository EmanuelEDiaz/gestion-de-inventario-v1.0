'use client';

import { useState } from 'react';
import { useReturns } from '../hooks/useReturns';
import { ReturnTable } from '../components/ReturnTable';
import { ReturnFormFields } from '../components/form/ReturnFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function ReturnsListView() {
  const { returns, loading, error, create, confirm, cancel, remove } = useReturns();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nueva Devolución</CardTitle></CardHeader>
          <CardContent>
            <ReturnFormFields
              onSubmit={async (data) => {
                setIsCreating(true);
                try {
                  await create(data);
                  toast.success('Devolución creada');
                  setShowForm(false);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Error al crear devolución');
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
          <CardTitle>Devoluciones</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} title="Crear nueva devolución">
              <Plus className="h-4 w-4 mr-2" />Nueva Devolución
            </Button>
          )}
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
