'use client';

import { useState, useEffect } from 'react';
import type { AppSettings, CostMethod, UpdateSettingsInput } from '@/core/settings/entities/app-settings';
import { COST_METHOD_LABELS } from '@/core/settings/entities/app-settings';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Input } from '@/presentation/shared/components/ui/Input';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import type { ComboboxOption } from '@/presentation/shared/components/form/ComboboxSelect';
import { LabelWithHint } from '@/presentation/shared/components/form/LabelWithHint';
import { useCurrenciesController } from '@/presentation/modules/currencies/hooks/useCurrenciesController';
import { SystemSettingsFields } from './SystemSettingsFields';

const COST_METHODS: CostMethod[] = ['STANDARD', 'WAC', 'FIFO'];

interface GeneralSettingsFieldsProps {
  settings: AppSettings;
  onSubmit: (data: { data: UpdateSettingsInput; version: number }) => void;
  isSubmitting: boolean;
}

export function GeneralSettingsFields({ settings, onSubmit, isSubmitting }: GeneralSettingsFieldsProps) {
  const [companyName, setCompanyName] = useState(settings.companyName ?? '');
  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState(settings.defaultCurrencyCode);
  const [defaultCostMethod, setDefaultCostMethod] = useState<CostMethod>(settings.defaultCostMethod);
  const [lowStockThreshold, setLowStockThreshold] = useState(
    settings.lowStockThresholdDefault?.toString() ?? ''
  );

  useEffect(() => {
    setCompanyName(settings.companyName ?? '');
    setDefaultCurrencyCode(settings.defaultCurrencyCode);
    setDefaultCostMethod(settings.defaultCostMethod);
    setLowStockThreshold(settings.lowStockThresholdDefault?.toString() ?? '');
  }, [settings]);

  const { currencies, isLoading } = useCurrenciesController();

  const currencyOptions: ComboboxOption[] = currencies.map(c => ({
    value: c.code,
    label: c.symbol ? `${c.code} - ${c.name} (${c.symbol})` : `${c.code} - ${c.name}`,
  }));

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-base font-semibold">Configuración del sistema</h3>
        <p className="text-sm text-muted-foreground">
          Estos valores se guardan en la base de datos y afectan a todos los usuarios.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <LabelWithHint htmlFor="companyName" label="Nombre de la empresa"
            hint="Nombre que aparece en reportes, facturas y documentos generados por el sistema" />
          <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Mi Empresa S.A." maxLength={200} />
          <p className="text-xs text-muted-foreground">Aparece en reportes y documentos generados por el sistema.</p>
        </div>

        <div className="space-y-2">
          <LabelWithHint htmlFor="currencyCode" label="Moneda predeterminada"
            hint="Moneda base para precios, reportes financieros y operaciones del sistema" />
          <ComboboxSelect value={defaultCurrencyCode}
            onChange={setDefaultCurrencyCode} placeholder="Selecciona una moneda"
            options={currencyOptions} disabled={isLoading} className="w-full sm:w-72" />
          <p className="text-xs text-muted-foreground">Moneda por defecto para precios y reportes.</p>
        </div>

        <div className="space-y-2">
          <LabelWithHint label="Método de costeo predeterminado"
            hint="Define cómo se calcula el costo de los productos al salir del inventario"
            hintDescription="Standard: costo fijo | WAC: promedio ponderado | FIFO: primera entrada, primera salida" />
          <div className="space-y-2">
            {COST_METHODS.map((method) => (
              <label key={method} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="costMethod" value={method} checked={defaultCostMethod === method}
                  onChange={() => setDefaultCostMethod(method)} className="h-4 w-4" />
                <span className="text-sm">{COST_METHOD_LABELS[method]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <LabelWithHint htmlFor="lowStock" label="Umbral de stock bajo (predeterminado)"
            hint="Cantidad mínima de existencias antes de generar una alerta de stock bajo para productos nuevos" />
          <Input id="lowStock" type="number" min={0} value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)} placeholder="10" className="w-32" />
          <p className="text-xs text-muted-foreground">Cantidad mínima antes de generar alertas de stock bajo en productos.</p>
        </div>

        <SystemSettingsFields updatedAt={settings.updatedAt} version={settings.version} />

        <TooltipWrapper content="Guardar configuración del sistema">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar configuración del sistema'}
          </Button>
        </TooltipWrapper>
      </form>
    </section>
  );
}
