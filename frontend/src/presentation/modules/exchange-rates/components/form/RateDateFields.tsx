'use client';

import { Input } from '@/presentation/shared/components/ui/Input';

interface RateDateFieldsProps {
  validFrom: string;
  onValidFromChange: (value: string) => void;
}

export function RateDateFields({ validFrom, onValidFromChange }: RateDateFieldsProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="validFrom" className="text-sm font-medium">Válida desde</label>
      <Input
        id="validFrom"
        type="date"
        value={validFrom}
        onChange={(e) => onValidFromChange(e.target.value)}
        required
        title="Fecha a partir de la cual aplica esta tasa"
      />
    </div>
  );
}
