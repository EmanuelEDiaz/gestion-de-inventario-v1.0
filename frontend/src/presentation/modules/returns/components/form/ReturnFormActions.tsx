'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Textarea } from '@/presentation/shared/components/form/Textarea';

interface ReturnFormActionsProps {
  notes: string;
  isSubmitting: boolean;
  onNotesChange: (val: string) => void;
  onCancel: () => void;
}

export function ReturnFormActions({
  notes, isSubmitting, onNotesChange, onCancel,
}: ReturnFormActionsProps) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notas</label>
        <Textarea id="notes" value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Notas adicionales..." rows={2} />
      </div>
      <div className="flex gap-2">
        <TooltipWrapper content="Crear nueva devolución" side="top">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Devolución'}</Button>
        </TooltipWrapper>
        <TooltipWrapper content="Cancelar devolución" side="top">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </TooltipWrapper>
      </div>
    </>
  );
}
