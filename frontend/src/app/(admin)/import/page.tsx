'use client';

import { ImportView } from '@/presentation/modules/import';

export default function ImportPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Importar Datos</h1>
      <ImportView />
    </div>
  );
}
