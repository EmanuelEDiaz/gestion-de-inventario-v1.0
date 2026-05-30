'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
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
  const searchParams = useSearchParams();
  const prefillSupplierId = searchParams.get('supplierId');

  const { purchases, isLoading, error, create, confirm, receive, cancel, deleteMany } = usePurchases();
  const [showForm, setShowForm] = useState(false);
  const { columns, actions } = usePurchaseColumns({ onConfirm: confirm, onReceive: receive, onCancel: cancel });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Compras" description="Gestiona las compras del sistema"
        actions={!showForm && <TooltipWrapper content="Crear nueva compra" side="top"><Button size="sm" onClick={() => setShowForm(true)}>+ Nueva Compra</Button></TooltipWrapper>}
      />
      {showForm && (
        <PurchaseFormFields
          prefillSupplierId={prefillSupplierId || undefined}
          onSubmit={async (data) => {
            try { const r = await create(data); if (r) { setShowForm(false); toast.success('Compra creada correctamente'); } }
            catch (e) { toast.error(e instanceof Error ? e.message : 'Error al crear compra'); }
          }}
          onContinue={async (data) => {
            try { const r = await create(data); if (r) { toast.success('Compra creada. Puedes seguir agregando.'); } }
            catch (e) { toast.error(e instanceof Error ? e.message : 'Error al crear compra'); }
          }}
          isSubmitting={false} onCancel={() => setShowForm(false)}
        />
      )}
      <GenericTable data={purchases} columns={columns} actions={actions}
        selectable onDeleteSelected={deleteMany}
        emptyMessage="No hay compras registradas" />
    </div>
  );
}

