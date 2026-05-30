'use client';

import type { Transfer } from '@/core/transfer/entities/transfer';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Button } from '@/presentation/shared/components/ui/Button';
import { CheckCircle, Truck, XCircle, Trash2 } from '@/presentation/shared/components/ui/icon-mapping';

interface TransferActionsProps {
  status: Transfer['status'];
  id: string;
  onConfirm?: (id: string) => void;
  onShip?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TransferActions({ 
  status, id, onConfirm, onShip, onComplete, onCancel, onDelete 
}: TransferActionsProps) {
  const canCancel = status !== 'COMPLETED' && status !== 'CANCELLED';
  const canDelete = status === 'DRAFT' || status === 'CANCELLED';

  return (
    <div className="flex justify-end gap-1">
      {status === 'DRAFT' && onConfirm && (
        <TooltipWrapper content="Confirmar transferencia" side="left">
          <Button size="sm" variant="outline" onClick={() => onConfirm(id)}>
            <CheckCircle className="h-4 w-4" />
          </Button>
        </TooltipWrapper>
      )}
      {status === 'CONFIRMED' && onShip && (
        <TooltipWrapper content="Despachar transferencia" side="left">
          <Button size="sm" variant="outline" onClick={() => onShip(id)}>
            <Truck className="h-4 w-4" />
          </Button>
        </TooltipWrapper>
      )}
      {status === 'IN_TRANSIT' && onComplete && (
        <TooltipWrapper content="Completar recepción" side="left">
          <Button size="sm" variant="outline" onClick={() => onComplete(id)}>
            <CheckCircle className="h-4 w-4 text-success" />
          </Button>
        </TooltipWrapper>
      )}
      {canCancel && onCancel && (
        <TooltipWrapper content="Cancelar transferencia" side="left">
          <Button size="sm" variant="ghost" onClick={() => onCancel(id)}>
            <XCircle className="h-4 w-4 text-danger" />
          </Button>
        </TooltipWrapper>
      )}
      {canDelete && onDelete && (
        <TooltipWrapper content="Eliminar transferencia" side="left">
          <Button size="sm" variant="ghost" onClick={() => onDelete(id)}>
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </TooltipWrapper>
      )}
    </div>
  );
}
