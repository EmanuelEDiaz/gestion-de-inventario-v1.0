'use client';

import type { Adjustment } from '@/core/entities/adjustment';
import { Button } from '@/presentation/shared/components/ui/Button';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface AdjustmentActionsProps {
  status: Adjustment['status'];
  id: string;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AdjustmentActions({ status, id, onConfirm, onCancel, onDelete }: AdjustmentActionsProps) {
  const canConfirm = status === 'DRAFT';
  const canCancel = status === 'DRAFT';
  const canDelete = status === 'DRAFT' || status === 'CANCELLED';

  return (
    <div className="flex justify-end gap-1">
      {canConfirm && onConfirm && (
        <Button size="sm" variant="outline" onClick={() => onConfirm(id)} title="Confirmar">
          <CheckCircle className="h-4 w-4 text-green-600" />
        </Button>
      )}
      {canCancel && onCancel && (
        <Button size="sm" variant="ghost" onClick={() => onCancel(id)} title="Cancelar">
          <XCircle className="h-4 w-4 text-red-600" />
        </Button>
      )}
      {canDelete && onDelete && (
        <Button size="sm" variant="ghost" onClick={() => onDelete(id)} title="Eliminar">
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      )}
    </div>
  );
}
