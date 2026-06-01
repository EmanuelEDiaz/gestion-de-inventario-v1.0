'use client';

import { useMemo, useState } from 'react';
import { Pencil, Power, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';
import { useCurrenciesController } from '../hooks/useCurrenciesController';
import { CurrencyFormFields } from '../components/form/CurrencyFormFields';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { GenericTable } from '@/presentation/shared/components/data-display/GenericTable';
import { FilterBar } from '@/presentation/shared/components/ui/FilterBar';
import type { Column, TableAction, BulkAction } from '@/presentation/shared/components/data-display/GenericTable';
import type { Currency, CreateCurrencyInput } from '@/core/currency/entities/currency';
import { statusBadge } from '@/presentation/shared/lib/colors';

type CurrencyRow = Currency & { id: string };

const COLUMNS: Column<CurrencyRow>[] = [
  { key: 'code', label: 'Código', render: (_, r) => <TooltipWrapper content="Código ISO de la moneda"><span className="font-mono font-semibold">{r.code}</span></TooltipWrapper> },
  { key: 'name', label: 'Nombre', render: (_, r) => <TooltipWrapper content="Nombre de la moneda"><span>{r.name}</span></TooltipWrapper> },
  { key: 'symbol', label: 'Símbolo', render: (_, r) => <TooltipWrapper content="Símbolo de la moneda"><span>{r.symbol ?? '—'}</span></TooltipWrapper> },
  {
    key: 'isActive', label: 'Estado',
    render: (_, r) => (
      <TooltipWrapper content={r.isActive ? 'Moneda activa' : 'Moneda inactiva'}>
        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadge(r.isActive)}`}>
          {r.isActive ? 'Activa' : 'Inactiva'}
        </span>
      </TooltipWrapper>
    ),
  },
];

export function CurrenciesView() {
  const { currencies, isLoading, error, create, update, remove, removeMany, bulkDisable, bulkEnable, isCreating } = useCurrenciesController();
  const [showForm, setShowForm] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const rows = useMemo<CurrencyRow[]>(() => currencies.map(c => ({ ...c, id: c.code })), [currencies]);

  const createInitialValues = useMemo<Partial<CreateCurrencyInput> | undefined>(() => {
    if (editingCurrency) return undefined;
    if (currencies.length > 0) {
      const c = currencies[0];
      return { code: c.code, name: c.name, symbol: c.symbol ?? undefined };
    }
    return undefined;
  }, [editingCurrency, currencies]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.symbol ?? '').toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active') result = result.filter(r => r.isActive);
    else if (statusFilter === 'inactive') result = result.filter(r => !r.isActive);
    return result;
  }, [rows, searchQuery, statusFilter]);

  const handleCreate = async (data: Parameters<typeof create>[0]) => {
    await create(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: Parameters<typeof create>[0]) => {
    if (!editingCurrency) return;
    await update({ code: editingCurrency.code, data: { name: data.name, symbol: data.symbol } });
    setEditingCurrency(null);
  };

  const actions = useMemo<TableAction<CurrencyRow>[]>(() => [
    {
      icon: Pencil, title: 'Editar moneda',
      onClick: (row) => setEditingCurrency(currencies.find(c => c.code === row.code) ?? null),
    },
    {
      icon: Power, title: 'Activar/desactivar moneda',
      confirmMessage: (row) => `¿Estás seguro de ${row.isActive ? 'desactivar' : 'activar'} la moneda ${row.code}?`,
      onClick: (row) => update({ code: row.code, data: { isActive: !row.isActive } }),
    },
    {
      icon: Trash2, title: 'Eliminar moneda',
      confirmMessage: (row) => `¿Estás seguro de eliminar la moneda ${row.code}? Esta acción no se puede deshacer.`,
      onClick: (row) => remove(row.code),
    },
  ], [currencies, update, remove]);

  const bulkActions = useMemo<BulkAction[]>(() => [
    {
      label: 'Habilitar seleccionadas',
      variant: 'default',
      confirmMessage: (count) => `¿Estás seguro de habilitar ${count} moneda(s)?`,
      onClick: (ids) => bulkEnable(ids),
    },
    {
      label: 'Desactivar seleccionadas',
      variant: 'destructive',
      confirmMessage: (count) => `¿Estás seguro de desactivar ${count} moneda(s)?`,
      onClick: (ids) => bulkDisable(ids),
    },
    {
      label: 'Eliminar seleccionadas',
      variant: 'destructive',
      confirmMessage: (count) => `¿Estás seguro de eliminar ${count} moneda(s)? Esta acción no se puede deshacer.`,
      onClick: (ids) => removeMany(ids),
    },
  ], [bulkEnable, bulkDisable, removeMany]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Monedas" description="Gestiona las monedas del sistema"
        actions={!showForm && !editingCurrency && <TooltipWrapper content="Crear nueva moneda"><Button size="sm" onClick={() => setShowForm(true)}>+ Nueva Moneda</Button></TooltipWrapper>}
      />
      {(showForm || editingCurrency) && (
        <CurrencyFormFields
          initialData={editingCurrency ?? undefined}
          initialValues={editingCurrency ? undefined : createInitialValues}
          onSubmit={editingCurrency ? handleUpdate : handleCreate}
          isSubmitting={isCreating}
          onCancel={() => { setShowForm(false); setEditingCurrency(null); }}
        />
      )}
      {!showForm && !editingCurrency && (
        <FilterBar
          searchPlaceholder="Buscar por código, nombre o símbolo..."
          onSearch={setSearchQuery}
          filters={[
            {
              key: 'status',
              label: 'Estado',
              type: 'select',
              options: [
                { value: 'active', label: 'Activa' },
                { value: 'inactive', label: 'Inactiva' },
              ],
              placeholder: 'Todos',
            },
          ]}
          filterValues={{ status: statusFilter }}
          onFilterChange={(key, value) => {
            if (key === 'status') setStatusFilter(value);
          }}
        />
      )}
      <GenericTable
        data={filteredRows}
        columns={COLUMNS}
        actions={actions}
        selectable={true}
        bulkActions={bulkActions}
        emptyMessage="No hay monedas registradas"
      />
    </div>
  );
}
