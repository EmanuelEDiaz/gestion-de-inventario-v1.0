'use client';

import { ExchangeRatesView } from '@/presentation/modules/exchange-rates';

export default function ExchangeRatesPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tasas de Cambio</h1>
      <ExchangeRatesView />
    </div>
  );
}
