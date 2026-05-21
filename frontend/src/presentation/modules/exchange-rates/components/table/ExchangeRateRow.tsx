'use client';

import type { ExchangeRate } from '@/core/exchange-rate/entities/exchange-rate';
import { RATE_TYPE_LABELS } from '@/core/exchange-rate/entities/exchange-rate';
import { Badge } from '@/presentation/shared/components/ui/badge';

interface ExchangeRateRowProps {
  rate: ExchangeRate;
}

export function ExchangeRateRow({ rate }: ExchangeRateRowProps) {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-3 font-mono">{rate.baseCode}/{rate.quoteCode}</td>
      <td className="p-3 text-right font-mono">{rate.rate.toFixed(4)}</td>
      <td className="p-3">
        <Badge variant="outline">{RATE_TYPE_LABELS[rate.rateType]}</Badge>
      </td>
      <td className="p-3 text-muted-foreground">
        {new Date(rate.validFrom).toLocaleDateString('es')}
      </td>
      <td className="p-3 text-muted-foreground text-xs">
        {new Date(rate.createdAt).toLocaleString('es')}
      </td>
    </tr>
  );
}
