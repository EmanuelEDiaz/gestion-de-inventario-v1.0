'use client';

import { useState } from 'react';
import { useTransfers } from '../hooks/useTransfers';
import { TransferTable } from '../components/TransferTable';
import { TransferFormFields } from '../components/form/TransferFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function TransfersListView() {
  const { transfers, loading, error, create, confirm, ship, complete, cancel, remove } = useTransfers();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6">
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nueva Transferencia</CardTitle></CardHeader>
          <CardContent>
            <TransferFormFields
              onSubmit={async (data) => {
                setIsCreating(true);
                try {
                  await create(data);
                  toast.success('Transferencia creada');
                  setShowForm(false);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Error al crear transferencia');
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
          <CardTitle>Transferencias</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} title="Crear nueva transferencia">
              <Plus className="h-4 w-4 mr-2" />Nueva Transferencia
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading && <LoadingSpinner />}
          {error && <AlertMessage variant="error" message={error} />}
          {!loading && !error && (
            <TransferTable
              transfers={transfers}
              onConfirm={confirm}
              onShip={ship}
              onComplete={complete}
              onCancel={cancel}
              onDelete={remove}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
