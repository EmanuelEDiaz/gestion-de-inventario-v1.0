'use client';

import { SettingsView } from '@/presentation/modules/settings';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>
      <SettingsView />
    </div>
  );
}
