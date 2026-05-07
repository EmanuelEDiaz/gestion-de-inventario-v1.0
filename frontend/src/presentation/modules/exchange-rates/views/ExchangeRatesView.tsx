'use client';

import { useState } from 'react';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useExchangeRatesController } from '../hooks/useExchangeRatesController';
import { ExchangeRateFormFields } from '../components/form/ExchangeRateFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/PageHeader';
import { GenericTable } from '@/presentation/shared/components/GenericTable';
import type { Column } from '@/presentation/shared/components/GenericTable';
import { RATE_TYPE_LABELS } from '@/core/entities/exchange-rate';
import type { ExchangeRate } from '@/core/entities/exchange-rate';

const COLUMNS: Column<ExchangeRate>[] = [
  { key: 'baseCode', label: 'Par', render: (_, r) => <span className="font-mono font-medium" title="Par de monedas">{r.baseCode}/{r.quoteCode}</span> },
  { key: 'rate', label: 'Tasa', render: (_, r) => <span className="font-mono" title="Tasa de cambio">{r.rate.toFixed(4)}</span> },
  { key: 'rateType', label: 'Tipo', render: (_, r) => <span title="Tipo de tasa">{RATE_TYPE_LABELS[r.rateType]}</span> },
  { key: 'validFrom', label: 'Válida desde', render: (_, r) => <span title="Fecha desde la que aplica">{new Date(r.validFrom).toLocaleDateString('es')}</span> },
  { key: 'createdAt', label: 'Creada', render: (_, r) => <span title="Fecha de registro">{new Date(r.createdAt).toLocaleDateString('es')}</span> },
];

export function ExchangeRatesView() {
  const { rates, isLoading, error, create, isCreating } = useExchangeRatesController();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Tasas de Cambio" description="Historial de tasas de cambio entre monedas"
        actions={!showForm && <Button size="sm" onClick={() => setShowForm(true)} title="Registrar nueva tasa de cambio">+ Nueva Tasa</Button>}
      />
      {showForm && (
        <ExchangeRateFormFields
          onSubmit={async (data) => {
            try { await create(data); setShowForm(false); toast.success('Tasa de cambio registrada correctamente'); }
            catch (err) { toast.error(err instanceof Error ? err.message : 'Error al registrar tasa de cambio'); }
          }}
          isSubmitting={isCreating} onCancel={() => setShowForm(false)}
        />
      )}
      <GenericTable data={rates} columns={COLUMNS} emptyMessage="No hay tasas de cambio registradas" />
    </div>
  );
}

