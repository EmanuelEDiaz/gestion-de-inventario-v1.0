'use client';

import type { Adjustment } from '@/core/adjustment/entities/adjustment';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Button } from '@/presentation/shared/components/ui/Button';
import { CheckCircle, XCircle, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';

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
        <TooltipWrapper content="Confirmar ajuste" side="left">
          <Button size="sm" variant="outline" onClick={() => onConfirm(id)}>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
        </TooltipWrapper>
      )}
      {canCancel && onCancel && (
        <TooltipWrapper content="Cancelar ajuste" side="left">
          <Button size="sm" variant="ghost" onClick={() => onCancel(id)}>
            <XCircle className="h-4 w-4 text-red-600" />
          </Button>
        </TooltipWrapper>
      )}
      {canDelete && onDelete && (
        <TooltipWrapper content="Eliminar ajuste" side="left">
          <Button size="sm" variant="ghost" onClick={() => onDelete(id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </TooltipWrapper>
      )}
    </div>
  );
}
