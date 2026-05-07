'use client';

import { useState } from 'react';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useAdjustments } from '../hooks/useAdjustments';
import { useAdjustmentColumns } from '../hooks/useAdjustmentColumns';
import { AdjustmentFormFields } from '../components/form/AdjustmentFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/PageHeader';
import { GenericTable } from '@/presentation/shared/components/GenericTable';

export function AdjustmentsListView() {
  const { adjustments, loading, error, create, confirm, cancel, remove } = useAdjustments();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { columns, actions } = useAdjustmentColumns({ onConfirm: confirm, onCancel: cancel, onDelete: remove });

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Ajustes de Inventario" description="Gestiona los ajustes de inventario"
        actions={!showForm && <Button size="sm" onClick={() => setShowForm(true)} title="Crear nuevo ajuste">+ Nuevo Ajuste</Button>}
      />
      {showForm && (
        <AdjustmentFormFields
          onSubmit={async (data) => {
            setIsCreating(true);
            try { await create(data); toast.success('Ajuste creado'); setShowForm(false); }
            catch (err) { toast.error(err instanceof Error ? err.message : 'Error al crear ajuste'); }
            finally { setIsCreating(false); }
          }}
          isSubmitting={isCreating} onCancel={() => setShowForm(false)}
        />
      )}
      <GenericTable data={adjustments} columns={columns} actions={actions} emptyMessage="No hay ajustes registrados" />
    </div>
  );
}

