'use client';

import { useState } from 'react';
import type { CreateCurrencyInput } from '@/core/entities/currency';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';

interface CurrencyFormFieldsProps {
  onSubmit: (data: CreateCurrencyInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function CurrencyFormFields({ onSubmit, isSubmitting, onCancel }: CurrencyFormFieldsProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ code: code.toUpperCase(), name, symbol: symbol || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label htmlFor="code" className="text-sm font-medium">Código ISO</label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="USD"
            maxLength={3}
            required
            title="Código ISO de 3 letras (ej: CUP, USD, EUR)"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">Nombre</label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dólar estadounidense"
            required
            title="Nombre completo de la moneda"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="symbol" className="text-sm font-medium">Símbolo</label>
          <Input
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="$"
            maxLength={5}
            title="Símbolo que se muestra junto a los montos"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Crear Moneda'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
