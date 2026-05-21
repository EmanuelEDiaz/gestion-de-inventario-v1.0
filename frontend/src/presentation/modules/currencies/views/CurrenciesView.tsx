'use client';

import { useMemo, useState } from 'react';
import { Power } from 'lucide-react';
import { toast } from '@/presentation/shared/components/ui/toast';
import { useCurrenciesController } from '../hooks/useCurrenciesController';
import { CurrencyFormFields } from '../components/form/CurrencyFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import type { Currency } from '@/core/currency/entities/currency';
import { statusBadge } from '@/presentation/shared/lib/colors';

type CurrencyRow = Currency & { id: string };

const COLUMNS: Column<CurrencyRow>[] = [
  { key: 'code', label: 'Código', render: (_, r) => <span className="font-mono font-semibold" title="Código ISO de la moneda">{r.code}</span> },
  { key: 'name', label: 'Nombre', render: (_, r) => <span title="Nombre de la moneda">{r.name}</span> },
  { key: 'symbol', label: 'Símbolo', render: (_, r) => <span title="Símbolo de la moneda">{r.symbol ?? '—'}</span> },
  {
    key: 'isActive', label: 'Estado',
    render: (_, r) => (
      <span title={r.isActive ? 'Moneda activa' : 'Moneda inactiva'}
        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadge(r.isActive)}`}>
        {r.isActive ? 'Activa' : 'Inactiva'}
      </span>
    ),
  },
];

export function CurrenciesView() {
  const { currencies, isLoading, error, create, update, isCreating } = useCurrenciesController();
  const [showForm, setShowForm] = useState(false);

  const rows = useMemo<CurrencyRow[]>(() => currencies.map(c => ({ ...c, id: c.code })), [currencies]);

  const actions = useMemo<TableAction<CurrencyRow>[]>(() => [
    { icon: Power, title: 'Activar/desactivar moneda', onClick: (row) => update({ code: row.code, data: { isActive: !row.isActive } }) },
  ], [update]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Monedas" description="Gestiona las monedas del sistema"
        actions={!showForm && <Button size="sm" onClick={() => setShowForm(true)} title="Agregar nueva moneda">+ Nueva Moneda</Button>}
      />
      {showForm && (
        <CurrencyFormFields
          onSubmit={async (data) => {
            try { await create(data); setShowForm(false); toast.success('Moneda creada correctamente'); }
            catch (err) { toast.error(err instanceof Error ? err.message : 'Error al crear moneda'); }
          }}
          isSubmitting={isCreating} onCancel={() => setShowForm(false)}
        />
      )}
      <GenericTable data={rows} columns={COLUMNS} actions={actions} emptyMessage="No hay monedas registradas" />
    </div>
  );
}
