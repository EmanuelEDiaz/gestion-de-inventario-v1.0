'use client';

import { useState } from 'react';
import { toast } from '@/presentation/shared/components/ui/toast';
import { usePurchases } from '../hooks/usePurchases';
import { usePurchaseColumns } from '../hooks/usePurchaseColumns';
import { PurchaseFormFields } from '../components/form/PurchaseFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';

export function PurchasesListView() {
  const { purchases, isLoading, error, create, confirm, receive, cancel } = usePurchases();
  const [showForm, setShowForm] = useState(false);
  const { columns, actions } = usePurchaseColumns({ onConfirm: confirm, onReceive: receive, onCancel: cancel });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Compras" description="Gestiona las compras del sistema"
        actions={!showForm && <Button size="sm" onClick={() => setShowForm(true)} title="Crear nueva compra">+ Nueva Compra</Button>}
      />
      {showForm && (
        <PurchaseFormFields
          onSubmit={async (data) => {
            try { const r = await create(data); if (r) { setShowForm(false); toast.success('Compra creada correctamente'); } }
            catch (e) { toast.error(e instanceof Error ? e.message : 'Error al crear compra'); }
          }}
          isSubmitting={false} onCancel={() => setShowForm(false)}
        />
      )}
      <GenericTable data={purchases} columns={columns} actions={actions} emptyMessage="No hay compras registradas" />
    </div>
  );
}

