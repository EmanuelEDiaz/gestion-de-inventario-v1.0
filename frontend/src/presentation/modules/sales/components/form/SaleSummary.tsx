'use client';

import { Button } from '@/presentation/shared/components/ui/Button';
import { Textarea } from '@/presentation/shared/components/Textarea';

interface SaleSummaryProps {
  notes: string;
  isSubmitting: boolean;
  onNotesChange: (notes: string) => void;
  onCancel: () => void;
}

export function SaleSummary({ notes, isSubmitting, onNotesChange, onCancel }: SaleSummaryProps) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notas</label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Notas adicionales..."
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear Venta'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </>
  );
}
