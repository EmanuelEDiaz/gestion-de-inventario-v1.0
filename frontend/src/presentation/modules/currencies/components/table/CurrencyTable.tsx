'use client';

import { useMemo } from 'react';
import { Power } from '@/presentation/shared/components/ui/icon-mapping';
import type { Currency } from '@/core/currency/entities/currency';
import { GenericTable, type Column, type TableAction } from '@/presentation/shared/components/data-display/GenericTable';
import { Badge } from '@/presentation/shared/components/ui/badge';

interface CurrencyTableProps {
  currencies: Currency[];
  onToggle: (code: string, isActive: boolean) => void;
}

type MappedCurrency = Currency & { id: string };

const COLUMNS: Column<MappedCurrency>[] = [
  { key: 'code', label: 'Código', render: (_, r) => <span className="font-mono font-medium">{r.code}</span> },
  { key: 'name', label: 'Nombre', render: (_, r) => <span>{r.name}</span> },
  { key: 'symbol', label: 'Símbolo', className: 'text-center', render: (_, r) => <span>{r.symbol ?? '—'}</span> },
  {
    key: 'isActive', label: 'Estado',
    render: (_, r) => <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Activa' : 'Inactiva'}</Badge>,
  },
];

export function CurrencyTable({ currencies, onToggle }: CurrencyTableProps) {
  const mappedData = useMemo(() => currencies.map(c => ({ ...c, id: c.code })), [currencies]);

  const actions = useMemo<TableAction<MappedCurrency>[]>(() => [
    { icon: Power, title: 'Desactivar', onClick: (r) => onToggle(r.code, false), hidden: (r) => !onToggle || !r.isActive },
    { icon: Power, title: 'Activar', onClick: (r) => onToggle(r.code, true), hidden: (r) => !onToggle || r.isActive },
  ], [onToggle]);

  return (
    <GenericTable data={mappedData} columns={COLUMNS} actions={actions}
      emptyMessage="No hay monedas registradas" />
  );
}
