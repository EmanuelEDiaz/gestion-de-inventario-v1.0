'use client';

import { Button } from '@/presentation/shared/components/ui/Button';
import { Textarea } from '@/presentation/shared/components/form/Textarea';

interface SaleSummaryProps {
  notes: string;
  isSubmitting: boolean;
  onNotesChange: (notes: string) => void;
  onCancel: () => void;
  notesError?: string;
}

export function SaleSummary({ notes, isSubmitting, onNotesChange, onCancel, notesError }: SaleSummaryProps) {
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
          error={!!notesError}
        />
        {notesError && (
          <p className="text-sm text-red-500">{notesError}</p>
        )}
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
