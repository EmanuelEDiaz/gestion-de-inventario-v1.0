'use client';

import { CurrenciesView } from '@/presentation/modules/currencies';

export default function CurrenciesPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Monedas</h1>
      <CurrenciesView />
    </div>
  );
}
