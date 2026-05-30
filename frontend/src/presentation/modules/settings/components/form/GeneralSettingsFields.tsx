'use client';

import { useState, useEffect } from 'react';
import type { AppSettings, CostMethod, UpdateSettingsInput } from '@/core/settings/entities/app-settings';
import { COST_METHOD_LABELS } from '@/core/settings/entities/app-settings';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Input } from '@/presentation/shared/components/ui/Input';
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
          <label htmlFor="companyName" className="text-sm font-medium">Nombre de la empresa</label>
          <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Mi Empresa S.A." maxLength={200} />
          <p className="text-xs text-muted-foreground">Aparece en reportes y documentos generados por el sistema.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="currencyCode" className="text-sm font-medium">Moneda predeterminada</label>
          <Input id="currencyCode" value={defaultCurrencyCode}
            onChange={(e) => setDefaultCurrencyCode(e.target.value.toUpperCase())} placeholder="CUP" maxLength={3} className="w-28" />
          <p className="text-xs text-muted-foreground">Código ISO 4217 de 3 letras (ej. CUP, USD, EUR).</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Método de costeo predeterminado</p>
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
          <label htmlFor="lowStock" className="text-sm font-medium">Umbral de stock bajo (predeterminado)</label>
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
