'use client';

import { useState } from 'react';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useTransfers } from '../hooks/useTransfers';
import { useTransferColumns } from '../hooks/useTransferColumns';
import { TransferFormFields } from '../components/form/TransferFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';

export function TransfersListView() {
  const { transfers, loading, error, create, confirm, ship, complete, cancel, remove, deleteMany } = useTransfers();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { columns, actions } = useTransferColumns({ onConfirm: confirm, onShip: ship, onComplete: complete, onCancel: cancel, onDelete: remove });

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Transferencias" description="Gestiona las transferencias entre almacenes"
        actions={!showForm && <TooltipWrapper content="Crear nueva transferencia" side="top"><Button size="sm" onClick={() => setShowForm(true)}>+ Nueva Transferencia</Button></TooltipWrapper>}
      />
      {showForm && (
        <TransferFormFields
          onSubmit={async (data) => {
            setIsCreating(true);
            try { await create(data); toast.success('Transferencia creada'); setShowForm(false); }
            catch (err) { toast.error(err instanceof Error ? err.message : 'Error al crear transferencia'); }
            finally { setIsCreating(false); }
          }}
          isSubmitting={isCreating} onCancel={() => setShowForm(false)}
        />
      )}
      <GenericTable data={transfers} columns={columns} actions={actions}
        selectable onDeleteSelected={deleteMany}
        emptyMessage="No hay transferencias registradas" />
    </div>
  );
}

