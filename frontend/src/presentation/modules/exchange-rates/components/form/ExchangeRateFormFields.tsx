'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import type { CreateExchangeRateInput, RateType, ExchangeRate } from '@/core/exchange-rate/entities/exchange-rate';
import { RATE_TYPE_LABELS } from '@/core/exchange-rate/entities/exchange-rate';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { LabelWithHint } from '@/presentation/shared/components/form/LabelWithHint';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import type { ComboboxOption } from '@/presentation/shared/components/form/ComboboxSelect';
import { useCurrenciesController } from '@/presentation/modules/currencies/hooks/useCurrenciesController';

const RATE_TYPES: RateType[] = ['OFFICIAL', 'MARKET', 'CUSTOM'];

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
    initialData ? new Date(initialData.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (isEditing) return;
    if (currencies.length < 2) return;
    if (!baseCode) setBaseCode(currencies[0].code);
    if (!quoteCode) setQuoteCode(currencies[1].code);
  }, [currencies, baseCode, quoteCode, isEditing]);

  const sameCurrency = baseCode && quoteCode && baseCode === quoteCode;

  useEffect(() => {
    if (isEditing) return;
    if (sameCurrency) return;
    if (!baseCode || !quoteCode) return;
    const match = rates.find(r => r.baseCode === baseCode && r.quoteCode === quoteCode);
    if (match) setRate(match.rate.toString());
  }, [baseCode, quoteCode, rates, sameCurrency, isEditing]);

  const currencyOptions: ComboboxOption[] = currencies.map(c => ({
    value: c.code,
    label: c.symbol ? `${c.code} - ${c.name} (${c.symbol})` : `${c.code} - ${c.name}`,
  }));

  const baseOptions = useMemo(
    () => currencyOptions.filter(o => o.value !== quoteCode),
    [currencyOptions, quoteCode]
  );

  const quoteOptions = useMemo(
    () => currencyOptions.filter(o => o.value !== baseCode),
    [currencyOptions, baseCode]
  );

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
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Tasa de Cambio' : 'Nueva Tasa de Cambio'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <LabelWithHint htmlFor="baseCode" label="Moneda Base"
                hint="Moneda de referencia desde la que se parte en la conversión"
                hintDescription="Ejemplo: USD en el par USD/CUP" />
              <ComboboxSelect value={baseCode} onChange={setBaseCode}
                placeholder="Selecciona moneda" options={baseOptions}
                disabled={isLoading || isEditing} emptyMessage="Sin monedas disponibles" />
            </div>
            <ArrowRight className="h-5 w-5 mb-3 text-muted-foreground shrink-0" aria-hidden />
            <div className="flex-1 space-y-1">
              <LabelWithHint htmlFor="quoteCode" label="Moneda Cotizada"
                hint="Moneda destino o contraparte en el par de conversión"
                hintDescription="Ejemplo: CUP en el par USD/CUP" />
              <ComboboxSelect value={quoteCode} onChange={setQuoteCode}
                placeholder="Selecciona moneda" options={quoteOptions}
                disabled={isLoading || isEditing} emptyMessage="Sin monedas disponibles" />
            </div>
          </div>

          {sameCurrency && (
            <p className="text-sm text-red-500">
              La moneda base y la moneda cotizada deben ser diferentes.
            </p>
          )}

          <div className="max-w-xs space-y-1">
            <LabelWithHint htmlFor="rate" label="Tasa"
              hint="Valor numérico de la tasa de cambio entre ambas monedas"
              hintDescription="Se auto-completa con la última tasa registrada para este par si existe. Cantidad de unidades de la moneda cotizada por 1 unidad de la moneda base." />
            <Input id="rate" type="number" step="0.000001" min="0"
              value={rate} onChange={(e) => setRate(e.target.value)}
              placeholder="120.00" required autoSelect />
          </div>

          <div className="space-y-2">
            <LabelWithHint label="Tipo de Tasa"
              hint="Clasificación de la tasa según su origen"
              hintDescription="Oficial: publicada por el banco central | Mercado: cotización informal | Personalizada: definida por el usuario" />
            <div className="flex gap-4">
              {RATE_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="rateType" value={type}
                    checked={rateType === type} onChange={() => setRateType(type)}
                    className="h-4 w-4" />
                  <span className="text-sm">{RATE_TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="max-w-xs space-y-1">
            <LabelWithHint htmlFor="validFrom" label="Válida desde"
              hint="Fecha a partir de la cual esta tasa de cambio entra en vigor"
              hintDescription="Puedes programar tasas con vigencia futura. Por defecto se establece la fecha actual." />
            <Input id="validFrom" type="date"
              value={validFrom} onChange={(e) => setValidFrom(e.target.value)}
              required autoSelect />
          </div>

          <div className="flex gap-2 pt-2">
            <TooltipWrapper content={isEditing ? 'Guardar los cambios de la tasa' : 'Guardar la nueva tasa de cambio'}>
              <Button type="submit" disabled={isSubmitting || sameCurrency}>
                {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Tasa' : 'Crear Tasa'}
              </Button>
            </TooltipWrapper>
            <TooltipWrapper content="Descartar cambios y volver al listado">
              <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            </TooltipWrapper>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
