'use client';

import { Sparkles } from 'lucide-react';

export function EditViewHeader() {
  return (
    <div className="rounded-2xl bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 text-white shadow-lg">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5" />
        <h1 className="text-2xl font-bold text-white">Modificar Producto</h1>
      </div>
      <p className="mt-1 text-indigo-100">Edita datos y administra el carrusel con imagen principal (máximo 8).</p>
    </div>
  );
}
