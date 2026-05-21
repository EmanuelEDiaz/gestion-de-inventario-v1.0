'use client';

import { useState } from 'react';
import type { CreateExchangeRateInput, RateType } from '@/core/exchange-rate/entities/exchange-rate';
import { Button } from '@/presentation/shared/components/ui/Button';
import { RateSourceFields } from './RateSourceFields';
import { RateValueFields } from './RateValueFields';
import { RateDateFields } from './RateDateFields';

interface ExchangeRateFormFieldsProps {
  onSubmit: (data: CreateExchangeRateInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

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
        <RateSourceFields baseCode={baseCode} quoteCode={quoteCode} onBaseCodeChange={setBaseCode} onQuoteCodeChange={setQuoteCode} />
        <RateValueFields rate={rate} rateType={rateType} onRateChange={setRate} onRateTypeChange={setRateType} />
        <RateDateFields validFrom={validFrom} onValidFromChange={setValidFrom} />
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
