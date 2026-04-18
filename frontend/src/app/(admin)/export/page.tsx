'use client';

import { ExportView } from '@/presentation/modules/export';

export default function ExportPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Exportar Datos</h1>
      <ExportView />
    </div>
  );
}
