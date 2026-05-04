'use client';

import { SalesListView } from '@/presentation/modules/sales';

export default function SalesPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Ventas</h1>
      <SalesListView />
    </div>
  );
}
