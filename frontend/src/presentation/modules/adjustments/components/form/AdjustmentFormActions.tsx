'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Button } from '@/presentation/shared/components/ui/Button';

interface AdjustmentFormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
}

export function AdjustmentFormActions({ isSubmitting, onCancel }: AdjustmentFormActionsProps) {
  return (
    <div className="flex gap-2">
      <TooltipWrapper content="Realizar ajuste de inventario manual" side="top">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Ajuste'}</Button>
      </TooltipWrapper>
      <TooltipWrapper content="Cancelar ajuste" side="top">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </TooltipWrapper>
    </div>
  );
}
