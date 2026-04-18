'use client';

import type { Currency } from '@/core/entities/currency';
import { Badge } from '@/presentation/shared/components/ui/badge';

interface CurrencyRowProps {
  currency: Currency;
  onToggle: (code: string, isActive: boolean) => void;
}

export function CurrencyRow({ currency, onToggle }: CurrencyRowProps) {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-3 font-mono font-medium">{currency.code}</td>
      <td className="p-3">{currency.name}</td>
      <td className="p-3 text-center">{currency.symbol ?? '—'}</td>
      <td className="p-3">
        <Badge variant={currency.isActive ? 'default' : 'secondary'}>
          {currency.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      </td>
      <td className="p-3">
        <button
          onClick={() => onToggle(currency.code, !currency.isActive)}
          className="text-sm text-primary hover:underline"
          title={currency.isActive ? 'Desactivar moneda' : 'Activar moneda'}
        >
          {currency.isActive ? 'Desactivar' : 'Activar'}
        </button>
      </td>
    </tr>
  );
}
