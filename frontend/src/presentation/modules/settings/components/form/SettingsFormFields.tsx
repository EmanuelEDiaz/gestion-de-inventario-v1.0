'use client';

import { useState } from 'react';
import type { AppSettings, CostMethod, UpdateSettingsInput } from '@/core/entities/app-settings';
import { COST_METHOD_LABELS } from '@/core/entities/app-settings';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';

interface SettingsFormFieldsProps {
  settings: AppSettings;
  onSubmit: (data: { data: UpdateSettingsInput; version: number }) => void;
  isSubmitting: boolean;
}

const COST_METHODS: CostMethod[] = ['STANDARD', 'WAC', 'FIFO'];

export function SettingsFormFields({ settings, onSubmit, isSubmitting }: SettingsFormFieldsProps) {
  const [companyName, setCompanyName] = useState(settings.companyName ?? '');
  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState(settings.defaultCurrencyCode);
  const [defaultCostMethod, setDefaultCostMethod] = useState(settings.defaultCostMethod);
  const [lowStockThreshold, setLowStockThreshold] = useState(
    settings.lowStockThresholdDefault?.toString() ?? ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      data: {
        companyName: companyName || undefined,
        defaultCurrencyCode,
        defaultCostMethod,
        lowStockThresholdDefault: lowStockThreshold ? Number(lowStockThreshold) : undefined,
      },
      version: settings.version,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="companyName" className="text-sm font-medium">
          Nombre de la Empresa
        </label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Mi Empresa S.A."
          title="Nombre que aparecerá en reportes y documentos"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="currencyCode" className="text-sm font-medium">
          Moneda Predeterminada
        </label>
        <Input
          id="currencyCode"
          value={defaultCurrencyCode}
          onChange={(e) => setDefaultCurrencyCode(e.target.value.toUpperCase())}
          placeholder="CUP"
          maxLength={3}
          title="Código ISO de la moneda principal del sistema"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Método de Costeo</label>
        <div className="space-y-2">
          {COST_METHODS.map((method) => (
            <label
              key={method}
              className="flex items-center gap-2 cursor-pointer"
              title={`Seleccionar ${COST_METHOD_LABELS[method]} como método de costeo predeterminado`}
            >
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
          Umbral de Stock Bajo (predeterminado)
        </label>
        <Input
          id="lowStock"
          type="number"
          min={0}
          value={lowStockThreshold}
          onChange={(e) => setLowStockThreshold(e.target.value)}
          placeholder="10"
          title="Cantidad mínima antes de generar alertas de stock bajo"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar Configuración'}
      </Button>
    </form>
  );
}
