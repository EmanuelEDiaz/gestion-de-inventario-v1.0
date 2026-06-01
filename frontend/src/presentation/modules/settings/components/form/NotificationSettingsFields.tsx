'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_UI_PREFS } from '@/core/settings/entities/app-settings';
import { userPreferencesRepository } from '@/infrastructure/repositories/user/UserPreferencesRepository';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { LabelWithHint } from '@/presentation/shared/components/form/LabelWithHint';
import { toast } from '@/presentation/shared/components/ui/toast';

export function NotificationSettingsFields() {
  const [maxProductPages, setMaxProductPages] = useState(DEFAULT_UI_PREFS.maxProductPages);
  const [searchDebounceMs, setSearchDebounceMs] = useState(DEFAULT_UI_PREFS.searchDebounceMs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userPreferencesRepository.get().then((prefs) => {
      setMaxProductPages(prefs.maxProductPages);
      setSearchDebounceMs(prefs.searchDebounceMs);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userPreferencesRepository.update({
        maxProductPages,
        searchDebounceMs,
      });
      toast.success('Preferencias guardadas', {
        description: 'Las preferencias de interfaz se guardaron en el servidor.',
      });
    } catch {
      toast.error('Error al guardar preferencias');
    }
  };

  if (loading) return null;

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-base font-semibold">Preferencias de interfaz</h3>
        <p className="text-sm text-muted-foreground">
          Estas preferencias se guardan en el servidor y persisten entre sesiones y dispositivos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <LabelWithHint htmlFor="maxProductPages" label="Artículos por página"
            hint="Cantidad de artículos que se muestran en cada página de listados"
            hintDescription="Un valor más alto muestra más artículos por página. Por defecto: 20." />
          <Input id="maxProductPages" type="number" min={5} max={100}
            value={maxProductPages}
            onChange={(e) => setMaxProductPages(Number(e.target.value))}
            placeholder="20" className="w-24" />
          <p className="text-xs text-muted-foreground">Artículos por página en listados (5-100). Por defecto: 20.</p>
        </div>

        <div className="space-y-2">
          <LabelWithHint htmlFor="searchDebounceMs" label="Retardo de búsqueda (ms)"
            hint="Milisegundos de espera antes de ejecutar una búsqueda al escribir"
            hintDescription="Un valor más alto reduce peticiones pero hace la búsqueda menos sensible. 300ms es lo recomendado." />
          <Input id="searchDebounceMs" type="number" min={100} max={2000} step={100}
            value={searchDebounceMs}
            onChange={(e) => setSearchDebounceMs(Number(e.target.value))}
            placeholder="300" className="w-24" />
          <p className="text-xs text-muted-foreground">Tiempo de espera antes de ejecutar búsquedas. 300ms es lo recomendado.</p>
        </div>

        <TooltipWrapper content="Guardar cambios">
          <Button type="submit" variant="outline">Guardar preferencias de interfaz</Button>
        </TooltipWrapper>
      </form>
    </section>
  );
}
