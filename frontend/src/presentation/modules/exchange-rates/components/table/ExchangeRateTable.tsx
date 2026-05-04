'use client';

import type { ExchangeRate } from '@/core/entities/exchange-rate';
import { ExchangeRateRow } from './ExchangeRateRow';
import { EmptyState } from '@/presentation/shared/components/EmptyState';

interface ExchangeRateTableProps {
  rates: ExchangeRate[];
}

export function ExchangeRateTable({ rates }: ExchangeRateTableProps) {
  if (rates.length === 0) {
    return <EmptyState message="No hay tasas de cambio registradas" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">Par</th>
            <th className="p-3 text-right font-medium">Tasa</th>
            <th className="p-3 text-left font-medium">Tipo</th>
            <th className="p-3 text-left font-medium">Válida desde</th>
            <th className="p-3 text-left font-medium">Creada</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => (
            <ExchangeRateRow key={rate.id} rate={rate} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
