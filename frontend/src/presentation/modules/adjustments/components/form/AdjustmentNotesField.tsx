'use client';

import { Textarea } from '@/presentation/shared/components/form/Textarea';

interface AdjustmentNotesFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function AdjustmentNotesField({ value, onChange }: AdjustmentNotesFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="notes" className="text-sm font-medium">Notas</label>
      <Textarea id="notes" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Notas adicionales..." rows={2} />
    </div>
  );
}
