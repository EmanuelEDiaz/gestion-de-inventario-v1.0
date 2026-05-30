'use client';

import { useState } from 'react';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useSales } from '../hooks/useSales';
import { useSaleColumns } from '../hooks/useSaleColumns';
import { SaleFormFields } from '../components/form/SaleFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';

export function SalesListView() {
  const { sales, isLoading, error, create, confirm, deliver, cancel, deleteMany } = useSales();
  const [showForm, setShowForm] = useState(false);
  const { columns, actions } = useSaleColumns({ onConfirm: confirm, onDeliver: deliver, onCancel: cancel });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Ventas" description="Gestiona las ventas del sistema"
        actions={!showForm && <TooltipWrapper content="Crear nueva venta" side="top"><Button size="sm" onClick={() => setShowForm(true)}>+ Nueva Venta</Button></TooltipWrapper>}
      />
      {showForm && (
        <SaleFormFields
          onSubmit={async (data) => {
            try { const r = await create(data); if (r) { setShowForm(false); toast.success('Venta creada correctamente'); } }
            catch (e) { toast.error(e instanceof Error ? e.message : 'Error al crear venta'); }
          }}
          isSubmitting={false} onCancel={() => setShowForm(false)}
        />
      )}
      <GenericTable data={sales} columns={columns} actions={actions}
        selectable onDeleteSelected={deleteMany}
        emptyMessage="No hay ventas registradas" />
    </div>
  );
}

