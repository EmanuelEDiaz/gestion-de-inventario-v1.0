'use client';

import { Button } from '@/presentation/shared/components/ui/Button';

interface AdjustmentFormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
}

export function AdjustmentFormActions({ isSubmitting, onCancel }: AdjustmentFormActionsProps) {
  return (
    <div className="flex gap-2">
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Ajuste'}</Button>
      <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
    </div>
  );
}
