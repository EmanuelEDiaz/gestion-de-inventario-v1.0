'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowRight } from '@/presentation/shared/components/ui/icon-mapping';
import type { CreateExchangeRateInput, RateType, ExchangeRate } from '@/core/exchange-rate/entities/exchange-rate';
import { RATE_TYPE_LABELS } from '@/core/exchange-rate/entities/exchange-rate';
import { EntityForm } from '@/presentation/shared/components/form/EntityForm';
import { useCurrenciesController } from '@/presentation/modules/currencies/hooks/useCurrenciesController';

interface ExchangeRateFormFieldsProps {
  rates: ExchangeRate[];
  initialData?: ExchangeRate;
  onSubmit: (data: CreateExchangeRateInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function ExchangeRateFormFields({ rates, initialData, onSubmit, isSubmitting, onCancel }: ExchangeRateFormFieldsProps) {
  const { currencies, isLoading } = useCurrenciesController();
  const isEditing = !!initialData;

  const [baseCode, setBaseCode] = useState(initialData?.baseCode ?? '');
  const [quoteCode, setQuoteCode] = useState(initialData?.quoteCode ?? '');
  const [rate, setRate] = useState(initialData?.rate.toString() ?? '');
  const [rateType, setRateType] = useState<RateType>(initialData?.rateType ?? 'OFFICIAL');
  const [validFrom, setValidFrom] = useState(
    initialData
      ? new Date(initialData.validFrom).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (isEditing) return;
    if (currencies.length < 2) return;
    if (!baseCode) setBaseCode(currencies[0].code);
    if (!quoteCode) setQuoteCode(currencies[1].code);
  }, [currencies, baseCode, quoteCode, isEditing]);

  const sameCurrency = Boolean(baseCode && quoteCode && baseCode === quoteCode);

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: c.symbol ? `${c.code} - ${c.name} (${c.symbol})` : `${c.code} - ${c.name}`,
  }));

  const values = { baseCode, quoteCode, rate, rateType, validFrom };
  const onChange = (field: string, value: string) => {
    if (field === 'baseCode') setBaseCode(value);
    else if (field === 'quoteCode') setQuoteCode(value);
    else if (field === 'rate') setRate(value);
    else if (field === 'rateType') setRateType(value as RateType);
    else if (field === 'validFrom') setValidFrom(value);
  };
  const fieldConfigs = useMemo(() => [
    {
      name: 'baseCode', label: 'Moneda Base', type: 'select' as const, required: true,
      options: currencyOptions, excludeByField: 'quoteCode',
      disabled: isLoading || isEditing, emptyMessage: 'Sin monedas disponibles',
      hint: 'Moneda de referencia desde la que se parte',
      hintDescription: 'Ejemplo: USD en el par USD/CUP',
    },
    {
      name: 'quoteCode', label: 'Moneda Cotizada', type: 'select' as const, required: true,
      options: currencyOptions, excludeByField: 'baseCode',
      disabled: isLoading || isEditing, emptyMessage: 'Sin monedas disponibles',
      hint: 'Moneda destino o contraparte',
      hintDescription: 'Ejemplo: CUP en el par USD/CUP',
    },
    {
      name: 'rate', label: 'Tasa', type: 'number' as const, step: '0.000001', min: 0, required: true,
      placeholder: '120.00', autoSelect: true, className: 'max-w-xs',
      autoFillSource: 'exchangeRates',
      hint: 'Valor numérico de la tasa de cambio',
      hintDescription: 'Se auto-completa con la última tasa registrada para este par si existe. Cantidad de unidades de la moneda cotizada por 1 unidad de la moneda base.',
    },
    {
      name: 'rateType', label: 'Tipo de Tasa', type: 'radio-group' as const,
      radioOptions: [
        { value: 'OFFICIAL', label: RATE_TYPE_LABELS.OFFICIAL },
        { value: 'MARKET', label: RATE_TYPE_LABELS.MARKET },
        { value: 'CUSTOM', label: RATE_TYPE_LABELS.CUSTOM },
      ],
      hint: 'Clasificación de la tasa según su origen',
      hintDescription: 'Oficial: banco central | Mercado: cotización informal | Personalizada: definida por el usuario',
    },
    {
      name: 'validFrom', label: 'Válida desde', type: 'date' as const, required: true,
      autoSelect: true, className: 'max-w-xs',
      hint: 'Fecha a partir de la cual esta tasa entra en vigor',
      hintDescription: 'Puedes programar tasas con vigencia futura. Por defecto se establece la fecha actual.',
    },
  ], [currencyOptions, isLoading, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sameCurrency) return;
    onSubmit({
      baseCode: baseCode.toUpperCase(),
      quoteCode: quoteCode.toUpperCase(),
      rate: Number(rate),
      rateType,
      validFrom: `${validFrom}T00:00:00Z`,
    });
  };

  return (
    <EntityForm
      title={isEditing ? 'Editar Tasa de Cambio' : 'Nueva Tasa de Cambio'}
      fields={fieldConfigs}
      values={values}
      onChange={onChange}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      isEditing={isEditing}
      submitDisabled={sameCurrency}
      submitLabel={isEditing ? 'Actualizar Tasa' : 'Crear Tasa'}
      submitLoadingLabel={isEditing ? 'Actualizando...' : 'Guardando...'}
      storageKey="exchange-rate-create"
      autoFillSources={{
        exchangeRates: {
          data: rates,
          matchFields: ['baseCode', 'quoteCode'],
          valueField: 'rate',
        },
      }}
      renderField={(field, defaultRender) => {
        if (field.name === 'baseCode') {
          const quoteField = fieldConfigs.find(f => f.name === 'quoteCode')!;
          return (
            <div key="baseQuotePair" className="flex items-end gap-2">
              <div className="flex-1">{defaultRender(field)}</div>
              <ArrowRight className="h-5 w-5 mb-3 text-muted-foreground shrink-0" aria-hidden />
              <div className="flex-1">{defaultRender(quoteField)}</div>
            </div>
          );
        }
        if (field.name === 'quoteCode') return null;
        return defaultRender(field);
      }}
      afterFields={sameCurrency ? (
        <p className="text-sm text-red-500">
          La moneda base y la moneda cotizada deben ser diferentes.
        </p>
      ) : undefined}
    />
  );
}
