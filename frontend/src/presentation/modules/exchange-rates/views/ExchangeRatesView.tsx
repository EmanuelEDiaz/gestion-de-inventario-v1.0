'use client';

import { useState } from 'react';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useExchangeRatesController } from '../hooks/useExchangeRatesController';
import { ExchangeRateFormFields } from '../components/form/ExchangeRateFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column } from '@/presentation/shared/components/data-display/GenericTable';
import { RATE_TYPE_LABELS } from '@/core/exchange-rate/entities/exchange-rate';
import type { ExchangeRate } from '@/core/exchange-rate/entities/exchange-rate';
import { Pencil, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';

export function ExchangeRatesView() {
  const { rates, isLoading, error, create, update, remove } = useExchangeRatesController();
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);

  const COLUMNS: Column<ExchangeRate>[] = [
    { key: 'baseCode', label: 'Par', render: (_, r) => <span className="font-mono font-medium" title="Par de monedas">{r.baseCode}/{r.quoteCode}</span> },
    { key: 'rate', label: 'Tasa', render: (_, r) => <span className="font-mono" title="Tasa de cambio">{r.rate.toFixed(4)}</span> },
    { key: 'rateType', label: 'Tipo', render: (_, r) => <span title="Tipo de tasa">{RATE_TYPE_LABELS[r.rateType]}</span> },
    { key: 'validFrom', label: 'Válida desde', render: (_, r) => <span title="Fecha desde la que aplica">{new Date(r.validFrom).toLocaleDateString('es')}</span> },
    { key: 'createdAt', label: 'Creada', render: (_, r) => <span title="Fecha de registro">{new Date(r.createdAt).toLocaleDateString('es')}</span> },
    {
      key: 'actions', label: 'Acciones', render: (_, r) => (
        <div className="flex gap-1">
          <TooltipWrapper content="Editar tasa de cambio">
            <Button variant="ghost" size="icon" onClick={() => setEditingRate(r)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipWrapper>
          <TooltipWrapper content="Eliminar tasa de cambio">
            <Button variant="ghost" size="icon" onClick={() => handleDelete(r)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipWrapper>
        </div>
      ),
    },
  ];

  const handleDelete = (rate: ExchangeRate) => {
    if (!confirm(`¿Estás seguro de eliminar la tasa ${rate.baseCode}/${rate.quoteCode}?`)) return;
    remove(rate.id)
      .then(() => toast.success('Tasa de cambio eliminada correctamente'))
      .catch((err: Error) => toast.error(err.message || 'Error al eliminar tasa'));
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  const handleCreate = async (data: Parameters<typeof create>[0]) => {
    await create(data);
    setShowForm(false);
    toast.success('Tasa de cambio registrada correctamente');
  };

  const handleUpdate = async (data: Parameters<typeof create>[0]) => {
    if (!editingRate) return;
    await update({ id: editingRate.id, data: { rate: data.rate, rateType: data.rateType, validFrom: data.validFrom } });
    setEditingRate(null);
    toast.success('Tasa de cambio actualizada correctamente');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tasas de Cambio" description="Historial de tasas de cambio entre monedas"
        actions={!showForm && !editingRate && <TooltipWrapper content="Crear nueva tasa de cambio"><Button size="sm" onClick={() => setShowForm(true)} title="Registrar nueva tasa de cambio">+ Nueva Tasa</Button></TooltipWrapper>}
      />
      {(showForm || editingRate) && (
        <ExchangeRateFormFields
          rates={rates}
          initialData={editingRate ?? undefined}
          onSubmit={editingRate ? handleUpdate : handleCreate}
          isSubmitting={false}
          onCancel={() => { setShowForm(false); setEditingRate(null); }}
        />
      )}
      <GenericTable data={rates} columns={COLUMNS} emptyMessage="No hay tasas de cambio registradas" />
    </div>
  );
}

