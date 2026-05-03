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
  const [maxProductPages, setMaxProductPages] = useState(
    settings.maxProductPages?.toString() ?? '20'
  );
  const [searchDebounceMs, setSearchDebounceMs] = useState(
    settings.searchDebounceMs?.toString() ?? '300'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      data: {
        companyName: companyName || undefined,
        defaultCurrencyCode,
        defaultCostMethod,
        lowStockThresholdDefault: lowStockThreshold ? Number(lowStockThreshold) : undefined,
        maxProductPages: maxProductPages ? Number(maxProductPages) : undefined,
        searchDebounceMs: searchDebounceMs ? Number(searchDebounceMs) : undefined,
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

      <div className="space-y-2">
        <label htmlFor="maxProductPages" className="text-sm font-medium">
          Máx. páginas de productos en memoria
        </label>
        <Input
          id="maxProductPages"
          type="number"
          min={1}
          max={50}
          value={maxProductPages}
          onChange={(e) => setMaxProductPages(e.target.value)}
          placeholder="20"
          title="Cantidad máxima de páginas de productos a mantener en memoria (afecta rendimiento)"
        />
        <p className="text-xs text-gray-500">
          Por defecto: 20 productos por página, hasta 20 páginas = 400 productos máximos en memoria
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
          value={searchDebounceMs}
          onChange={(e) => setSearchDebounceMs(e.target.value)}
          placeholder="300"
          title="Tiempo de espera antes de ejecutar la búsqueda (evita muchas peticiones)"
        />
        <p className="text-xs text-gray-500">
          Recomendado: 300ms para conexiones rápidas, 500-1000ms para conexiones lentas
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar Configuración'}
      </Button>
    </form>
  );
}
