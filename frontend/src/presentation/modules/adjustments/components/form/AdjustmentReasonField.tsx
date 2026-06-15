'use client';

import { Input } from '@/presentation/shared/components/ui/Input';

interface AdjustmentReasonFieldProps {
  value: string;
  onChange: (value: string) => void;
  reasonError?: string;
}

export function AdjustmentReasonField({ value, onChange, reasonError }: AdjustmentReasonFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="reason" className="text-sm font-medium">Razón</label>
      <Input id="reason" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Razón del ajuste" title="Motivo del ajuste" error={reasonError} />
    </div>
  );
}
