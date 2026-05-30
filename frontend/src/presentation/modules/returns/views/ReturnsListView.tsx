'use client';

import { useState } from 'react';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useReturns } from '../hooks/useReturns';
import { useReturnColumns } from '../hooks/useReturnColumns';
import { ReturnFormFields } from '../components/form/ReturnFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';

export function ReturnsListView() {
  const { returns, loading, error, create, confirm, cancel, remove, deleteMany } = useReturns();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { columns, actions } = useReturnColumns({ onConfirm: confirm, onCancel: cancel, onDelete: remove });

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Devoluciones" description="Gestiona las devoluciones del sistema"
        actions={!showForm && <TooltipWrapper content="Crear nueva devolución" side="top"><Button size="sm" onClick={() => setShowForm(true)}>+ Nueva Devolución</Button></TooltipWrapper>}
      />
      {showForm && (
        <ReturnFormFields
          onSubmit={async (data) => {
            setIsCreating(true);
            try { await create(data); toast.success('Devolución creada'); setShowForm(false); }
            catch (err) { toast.error(err instanceof Error ? err.message : 'Error al crear devolución'); }
            finally { setIsCreating(false); }
          }}
          isSubmitting={isCreating} onCancel={() => setShowForm(false)}
        />
      )}
      <GenericTable data={returns} columns={columns} actions={actions}
        selectable onDeleteSelected={deleteMany}
        emptyMessage="No hay devoluciones registradas" />
    </div>
  );
}

