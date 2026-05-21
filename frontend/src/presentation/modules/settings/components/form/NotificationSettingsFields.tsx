'use client';

import { useState, useEffect } from 'react';
import type { UiPreferences } from '@/core/settings/entities/app-settings';
import { DEFAULT_UI_PREFS } from '@/core/settings/entities/app-settings';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { toast } from '@/presentation/shared/components/ui/toast';

const UI_PREFS_KEY = 'ui_preferences';

function loadUiPrefs(): UiPreferences {
  if (typeof window === 'undefined') return DEFAULT_UI_PREFS;
  try {
    const stored = localStorage.getItem(UI_PREFS_KEY);
    if (stored) return { ...DEFAULT_UI_PREFS, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return DEFAULT_UI_PREFS;
}

function saveUiPrefs(prefs: UiPreferences): void {
  try {
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function NotificationSettingsFields() {
  const [uiPrefs, setUiPrefs] = useState<UiPreferences>(DEFAULT_UI_PREFS);

  useEffect(() => {
    setUiPrefs(loadUiPrefs());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveUiPrefs(uiPrefs);
    toast.success('Preferencias guardadas', {
      description: 'Las preferencias de interfaz se guardaron localmente.',
    });
  };

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-base font-semibold">Preferencias de interfaz</h3>
        <p className="text-sm text-muted-foreground">
          Estas preferencias se guardan solo en este navegador y no afectan a otros usuarios.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="maxProductPages" className="text-sm font-medium">Máx. páginas de productos en memoria</label>
          <Input id="maxProductPages" type="number" min={1} max={50}
            value={uiPrefs.maxProductPages}
            onChange={(e) => setUiPrefs((prev) => ({ ...prev, maxProductPages: Number(e.target.value) }))}
            placeholder="20" className="w-24" />
          <p className="text-xs text-muted-foreground">Cantidad de páginas a mantener en caché local (afecta rendimiento). Por defecto: 20.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="searchDebounceMs" className="text-sm font-medium">Retardo de búsqueda (ms)</label>
          <Input id="searchDebounceMs" type="number" min={100} max={2000} step={100}
            value={uiPrefs.searchDebounceMs}
            onChange={(e) => setUiPrefs((prev) => ({ ...prev, searchDebounceMs: Number(e.target.value) }))}
            placeholder="300" className="w-24" />
          <p className="text-xs text-muted-foreground">Tiempo de espera antes de ejecutar búsquedas. 300ms es lo recomendado.</p>
        </div>

        <Button type="submit" variant="outline">Guardar preferencias de interfaz</Button>
      </form>
    </section>
  );
}
