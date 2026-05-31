'use client';

import { useState, useMemo } from 'react';
import { useExchangeRatesController } from '../hooks/useExchangeRatesController';
import { ExchangeRateFormFields } from '../components/form/ExchangeRateFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import type { Column, TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { RATE_TYPE_LABELS } from '@/core/exchange-rate/entities/exchange-rate';
import type { ExchangeRate, RateType } from '@/core/exchange-rate/entities/exchange-rate';
import { Pencil, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { FilterBar } from '@/presentation/shared/components/ui/FilterBar';
import type { FilterDef } from '@/presentation/shared/components/ui/FilterBar';

export function ExchangeRatesView() {
  const { rates, isLoading, error, create, update, remove, removeMany } = useExchangeRatesController();
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filterDefs: FilterDef[] = [
    { key: 'rateType', label: 'Tipo de Tasa', type: 'select',
      options: [
        { value: 'OFFICIAL', label: 'Oficial' },
        { value: 'MARKET', label: 'Mercado' },
        { value: 'CUSTOM', label: 'Personalizada' },
      ] },
  ];

  const filteredRates = useMemo(() => {
    let result = rates;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.baseCode.toLowerCase().includes(q) || r.quoteCode.toLowerCase().includes(q));
    }
    if (filters.rateType) {
      result = result.filter(r => r.rateType === filters.rateType);
    }
    return result;
  }, [rates, search, filters]);

  const COLUMNS: Column<ExchangeRate>[] = [
    { key: 'baseCode', label: 'Par', render: (_, r) => <TooltipWrapper content="Par de monedas"><span className="font-mono font-medium">{r.baseCode}/{r.quoteCode}</span></TooltipWrapper> },
    { key: 'rate', label: 'Tasa', render: (_, r) => <TooltipWrapper content="Tasa de cambio"><span className="font-mono">{r.rate.toFixed(4)}</span></TooltipWrapper> },
    { key: 'rateType', label: 'Tipo', render: (_, r) => <TooltipWrapper content="Tipo de tasa"><span>{RATE_TYPE_LABELS[r.rateType]}</span></TooltipWrapper> },
    { key: 'validFrom', label: 'Válida desde', render: (_, r) => <TooltipWrapper content="Fecha desde la que aplica"><span>{new Date(r.validFrom).toLocaleDateString('es')}</span></TooltipWrapper> },
    { key: 'createdAt', label: 'Creada', render: (_, r) => <TooltipWrapper content="Fecha de registro"><span>{new Date(r.createdAt).toLocaleDateString('es')}</span></TooltipWrapper> },
  ];

  const actions = useMemo<TableAction<ExchangeRate>[]>(() => [
    { icon: Pencil, title: 'Editar tasa de cambio', onClick: setEditingRate },
    { icon: Trash2, title: 'Eliminar tasa de cambio', onClick: (r) => remove(r.id),
      confirmMessage: (r) => `¿Estás seguro de eliminar la tasa ${r.baseCode}/${r.quoteCode}? Esta acción no se puede deshacer.` },
  ], [remove]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  const handleCreate = async (data: Parameters<typeof create>[0]) => {
    await create(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: Parameters<typeof create>[0]) => {
    if (!editingRate) return;
    await update({ id: editingRate.id, data: { rate: data.rate, rateType: data.rateType, validFrom: data.validFrom } });
    setEditingRate(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tasas de Cambio" description="Historial de tasas de cambio entre monedas"
        actions={!showForm && !editingRate && <TooltipWrapper content="Crear nueva tasa de cambio"><Button size="sm" onClick={() => setShowForm(true)}>+ Nueva Tasa</Button></TooltipWrapper>}
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
      {!showForm && !editingRate && (
        <FilterBar
          searchPlaceholder="Buscar por par de monedas..."
          onSearch={setSearch}
          filters={filterDefs}
          filterValues={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        />
      )}
      <GenericTable data={filteredRates} columns={COLUMNS} actions={actions}
        selectable onDeleteSelected={removeMany}
        emptyMessage="No hay tasas de cambio registradas" />
    </div>
  );
}

