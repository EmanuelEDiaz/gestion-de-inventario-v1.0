'use client';

import { ReportsView } from '@/presentation/modules/reports';

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Reportes</h1>
      <ReportsView />
    </div>
  );
}
