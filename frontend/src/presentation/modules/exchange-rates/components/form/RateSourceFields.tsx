'use client';

import { Input } from '@/presentation/shared/components/ui/Input';

interface RateSourceFieldsProps {
  baseCode: string;
  quoteCode: string;
  onBaseCodeChange: (value: string) => void;
  onQuoteCodeChange: (value: string) => void;
}

export function RateSourceFields({ baseCode, quoteCode, onBaseCodeChange, onQuoteCodeChange }: RateSourceFieldsProps) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="baseCode" className="text-sm font-medium">Moneda Base</label>
        <Input
          id="baseCode"
          value={baseCode}
          onChange={(e) => onBaseCodeChange(e.target.value)}
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
          onChange={(e) => onQuoteCodeChange(e.target.value)}
          placeholder="CUP"
          maxLength={3}
          required
          title="Código de la moneda a la que se convierte"
        />
      </div>
    </>
  );
}
