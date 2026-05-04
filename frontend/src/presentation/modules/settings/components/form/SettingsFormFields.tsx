'use client';

import { useState, useEffect } from 'react';
import type { AppSettings, CostMethod, UpdateSettingsInput, UiPreferences } from '@/core/entities/app-settings';
import { COST_METHOD_LABELS, DEFAULT_UI_PREFS } from '@/core/entities/app-settings';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { toast } from '@/presentation/shared/components/ui/toast';

const UI_PREFS_KEY = 'ui_preferences';

const COST_METHODS: CostMethod[] = ['STANDARD', 'WAC', 'FIFO'];

interface SettingsFormFieldsProps {
  settings: AppSettings;
  onSubmit: (data: { data: UpdateSettingsInput; version: number }) => void;
  isSubmitting: boolean;
}

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

export function SettingsFormFields({ settings, onSubmit, isSubmitting }: SettingsFormFieldsProps) {
  // --- System settings (API persisted) ---
  const [companyName, setCompanyName] = useState(settings.companyName ?? '');
  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState(settings.defaultCurrencyCode);
  const [defaultCostMethod, setDefaultCostMethod] = useState<CostMethod>(settings.defaultCostMethod);
  const [lowStockThreshold, setLowStockThreshold] = useState(
    settings.lowStockThresholdDefault?.toString() ?? ''
  );

  // --- UI preferences (localStorage only) ---
  const [uiPrefs, setUiPrefs] = useState<UiPreferences>(DEFAULT_UI_PREFS);

  useEffect(() => {
    setUiPrefs(loadUiPrefs());
  }, []);

  // Sync system fields when settings reload from server (e.g., after version conflict refetch)
  useEffect(() => {
    setCompanyName(settings.companyName ?? '');
    setDefaultCurrencyCode(settings.defaultCurrencyCode);
    setDefaultCostMethod(settings.defaultCostMethod);
    setLowStockThreshold(settings.lowStockThresholdDefault?.toString() ?? '');
  }, [settings]);

  const handleSystemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      data: {
        companyName: companyName.trim() || undefined,
        defaultCurrencyCode: defaultCurrencyCode.trim().toUpperCase(),
        defaultCostMethod,
        lowStockThresholdDefault: lowStockThreshold ? Number(lowStockThreshold) : null,
      },
      version: settings.version,
    });
  };

  const handleUiPrefsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveUiPrefs(uiPrefs);
    toast.success('Preferencias guardadas', {
      description: 'Las preferencias de interfaz se guardaron localmente.',
    });
  };

  return (
    <div className="space-y-8">
      {/* ── Sección 1: Configuración del sistema (persiste en DB) ── */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Configuración del sistema</h3>
          <p className="text-sm text-muted-foreground">
            Estos valores se guardan en la base de datos y afectan a todos los usuarios.
          </p>
        </div>

        <form onSubmit={handleSystemSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-sm font-medium">
              Nombre de la empresa
            </label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Mi Empresa S.A."
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Aparece en reportes y documentos generados por el sistema.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="currencyCode" className="text-sm font-medium">
              Moneda predeterminada
            </label>
            <Input
              id="currencyCode"
              value={defaultCurrencyCode}
              onChange={(e) => setDefaultCurrencyCode(e.target.value.toUpperCase())}
              placeholder="CUP"
              maxLength={3}
              className="w-28"
            />
            <p className="text-xs text-muted-foreground">
              Código ISO 4217 de 3 letras (ej. CUP, USD, EUR).
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Método de costeo predeterminado</p>
            <div className="space-y-2">
              {COST_METHODS.map((method) => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="costMethod"
                    value={method}
                    checked={defaultCostMethod === method}
                    onChange={() => setDefaultCostMethod(method)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{COST_METHOD_LABELS[method]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="lowStock" className="text-sm font-medium">
              Umbral de stock bajo (predeterminado)
            </label>
            <Input
              id="lowStock"
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder="10"
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Cantidad mínima antes de generar alertas de stock bajo en productos.
            </p>
          </div>

          {settings.updatedAt && (
            <p className="text-xs text-muted-foreground">
              Última actualización: {new Date(settings.updatedAt).toLocaleString()} · versión {settings.version}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar configuración del sistema'}
          </Button>
        </form>
      </section>

      <hr className="border-border" />

      {/* ── Sección 2: Preferencias de interfaz (solo localStorage) ── */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Preferencias de interfaz</h3>
          <p className="text-sm text-muted-foreground">
            Estas preferencias se guardan solo en este navegador y no afectan a otros usuarios.
          </p>
        </div>

        <form onSubmit={handleUiPrefsSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="maxProductPages" className="text-sm font-medium">
              Máx. páginas de productos en memoria
            </label>
            <Input
              id="maxProductPages"
              type="number"
              min={1}
              max={50}
              value={uiPrefs.maxProductPages}
              onChange={(e) =>
                setUiPrefs((prev) => ({ ...prev, maxProductPages: Number(e.target.value) }))
              }
              placeholder="20"
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              Cantidad de páginas a mantener en caché local (afecta rendimiento). Por defecto: 20.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="searchDebounceMs" className="text-sm font-medium">
              Retardo de búsqueda (ms)
            </label>
            <Input
              id="searchDebounceMs"
              type="number"
              min={100}
              max={2000}
              step={100}
              value={uiPrefs.searchDebounceMs}
              onChange={(e) =>
                setUiPrefs((prev) => ({ ...prev, searchDebounceMs: Number(e.target.value) }))
              }
              placeholder="300"
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              Tiempo de espera antes de ejecutar búsquedas. 300ms es lo recomendado.
            </p>
          </div>

          <Button type="submit" variant="outline">
            Guardar preferencias de interfaz
          </Button>
        </form>
      </section>
    </div>
  );
}
