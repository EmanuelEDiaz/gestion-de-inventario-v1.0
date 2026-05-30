'use client';

import { Button } from '@/presentation/shared/components/ui/Button';
import { Textarea } from '@/presentation/shared/components/form/Textarea';

interface PurchaseSummaryProps {
  notes: string;
  onNotesChange: (v: string) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  showContinue?: boolean;
  onContinueClick?: () => void;
}

export function PurchaseSummary({ notes, onNotesChange, isSubmitting, onCancel, showContinue, onContinueClick }: PurchaseSummaryProps) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notas</label>
        <Textarea id="notes" value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Notas adicionales..." rows={2} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Compra'}</Button>
        {showContinue && (
          <Button type="submit" variant="outline" disabled={isSubmitting} onClick={onContinueClick}>
            {isSubmitting ? 'Creando...' : 'Crear y Continuar'}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </>
  );
}
