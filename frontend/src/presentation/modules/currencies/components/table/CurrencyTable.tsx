'use client';

import type { Currency } from '@/core/entities/currency';
import { CurrencyRow } from './CurrencyRow';
import { EmptyState } from '@/presentation/shared/components/EmptyState';

interface CurrencyTableProps {
  currencies: Currency[];
  onToggle: (code: string, isActive: boolean) => void;
}

export function CurrencyTable({ currencies, onToggle }: CurrencyTableProps) {
  if (currencies.length === 0) {
    return <EmptyState message="No hay monedas registradas" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">Código</th>
            <th className="p-3 text-left font-medium">Nombre</th>
            <th className="p-3 text-center font-medium">Símbolo</th>
            <th className="p-3 text-left font-medium">Estado</th>
            <th className="p-3 text-left font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currencies.map((c) => (
            <CurrencyRow key={c.code} currency={c} onToggle={onToggle} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
