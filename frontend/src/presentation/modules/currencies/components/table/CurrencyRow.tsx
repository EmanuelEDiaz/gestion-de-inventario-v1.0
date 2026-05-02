'use client';

import type { Currency } from '@/core/entities/currency';
import { Badge, TooltipWrapper } from '@/presentation/shared/components/ui';

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
        <TooltipWrapper content={currency.isActive ? 'Desactivar moneda' : 'Activar moneda'}>
          <button
            onClick={() => onToggle(currency.code, !currency.isActive)}
            className="text-sm text-primary hover:underline"
          >
            {currency.isActive ? 'Desactivar' : 'Activar'}
          </button>
        </TooltipWrapper>
      </td>
    </tr>
  );
}
