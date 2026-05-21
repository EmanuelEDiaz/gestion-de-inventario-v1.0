'use client';

import type { RateType } from '@/core/exchange-rate/entities/exchange-rate';
import { RATE_TYPE_LABELS } from '@/core/exchange-rate/entities/exchange-rate';
import { Input } from '@/presentation/shared/components/ui/Input';

const RATE_TYPES: RateType[] = ['OFFICIAL', 'MARKET', 'CUSTOM'];

interface RateValueFieldsProps {
  rate: string;
  rateType: RateType;
  onRateChange: (value: string) => void;
  onRateTypeChange: (value: RateType) => void;
}

export function RateValueFields({ rate, rateType, onRateChange, onRateTypeChange }: RateValueFieldsProps) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="rate" className="text-sm font-medium">Tasa</label>
        <Input
          id="rate"
          type="number"
          step="0.000001"
          min="0"
          value={rate}
          onChange={(e) => onRateChange(e.target.value)}
          placeholder="120.00"
          required
          title="Valor de la tasa de cambio"
        />
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
                onChange={() => onRateTypeChange(type)}
                className="h-4 w-4"
              />
              <span className="text-sm">{RATE_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
