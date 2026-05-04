'use client';

import { PurchasesListView } from '@/presentation/modules/purchases';

export default function PurchasesPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Compras</h1>
      <PurchasesListView />
    </div>
  );
}
