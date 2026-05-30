'use client';

import { useState } from 'react';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useAdjustments } from '../hooks/useAdjustments';
import { useAdjustmentColumns } from '../hooks/useAdjustmentColumns';
import { AdjustmentFormFields } from '../components/form/AdjustmentFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';

export function AdjustmentsListView() {
  const { adjustments, loading, error, create, confirm, cancel, remove, deleteMany } = useAdjustments();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { columns, actions } = useAdjustmentColumns({ onConfirm: confirm, onCancel: cancel, onDelete: remove });

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Ajustes de Inventario" description="Gestiona los ajustes de inventario"
        actions={!showForm && <TooltipWrapper content="Crear nuevo ajuste" side="top"><Button size="sm" onClick={() => setShowForm(true)}>+ Nuevo Ajuste</Button></TooltipWrapper>}
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
      <GenericTable data={adjustments} columns={columns} actions={actions}
        selectable onDeleteSelected={deleteMany}
        emptyMessage="No hay ajustes registrados" />
    </div>
  );
}

