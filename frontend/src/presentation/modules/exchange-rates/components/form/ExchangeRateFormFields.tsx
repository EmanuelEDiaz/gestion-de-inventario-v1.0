'use client';

import { useState } from 'react';
import type { CreateExchangeRateInput, RateType } from '@/core/exchange-rate/entities/exchange-rate';
import { RATE_TYPE_LABELS } from '@/core/exchange-rate/entities/exchange-rate';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';

interface ExchangeRateFormFieldsProps {
  onSubmit: (data: CreateExchangeRateInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const RATE_TYPES: RateType[] = ['OFFICIAL', 'MARKET', 'CUSTOM'];

export function ExchangeRateFormFields({ onSubmit, isSubmitting, onCancel }: ExchangeRateFormFieldsProps) {
  const [baseCode, setBaseCode] = useState('');
  const [quoteCode, setQuoteCode] = useState('');
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState<RateType>('OFFICIAL');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      baseCode: baseCode.toUpperCase(),
      quoteCode: quoteCode.toUpperCase(),
      rate: Number(rate),
      rateType,
      validFrom,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-1">
          <label htmlFor="baseCode" className="text-sm font-medium">Moneda Base</label>
          <Input
            id="baseCode"
            value={baseCode}
            onChange={(e) => setBaseCode(e.target.value)}
            placeholder="USD"
            maxLength={3}
            required
            title="Código de la moneda base"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="quoteCode" className="text-sm font-medium">Moneda Cotizada</label>
          <Input
            id="quoteCode"
            value={quoteCode}
            onChange={(e) => setQuoteCode(e.target.value)}
            placeholder="CUP"
            maxLength={3}
            required
            title="Código de la moneda a la que se convierte"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="rate" className="text-sm font-medium">Tasa</label>
          <Input
            id="rate"
            type="number"
            step="0.000001"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="120.00"
            required
            title="Valor de la tasa de cambio"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="validFrom" className="text-sm font-medium">Válida desde</label>
          <Input
            id="validFrom"
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            required
            title="Fecha a partir de la cual aplica esta tasa"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Tipo de Tasa</label>
        <div className="flex gap-4">
          {RATE_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer" title={`Tasa de tipo ${RATE_TYPE_LABELS[type]}`}>
              <input
                type="radio"
                name="rateType"
                value={type}
                checked={rateType === type}
                onChange={() => setRateType(type)}
                className="h-4 w-4"
              />
              <span className="text-sm">{RATE_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Crear Tasa'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
