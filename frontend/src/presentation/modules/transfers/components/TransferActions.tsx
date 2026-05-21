'use client';

import type { Transfer } from '@/core/transfer/entities/transfer';
import { Button } from '@/presentation/shared/components/ui/Button';
import { CheckCircle, Truck, XCircle, Trash2 } from 'lucide-react';

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
        <Button size="sm" variant="outline" onClick={() => onConfirm(id)} title="Confirmar">
          <CheckCircle className="h-4 w-4" />
        </Button>
      )}
      {status === 'CONFIRMED' && onShip && (
        <Button size="sm" variant="outline" onClick={() => onShip(id)} title="Enviar">
          <Truck className="h-4 w-4" />
        </Button>
      )}
      {status === 'IN_TRANSIT' && onComplete && (
        <Button size="sm" variant="outline" onClick={() => onComplete(id)} title="Completar">
          <CheckCircle className="h-4 w-4 text-success" />
        </Button>
      )}
      {canCancel && onCancel && (
        <Button size="sm" variant="ghost" onClick={() => onCancel(id)} title="Cancelar">
          <XCircle className="h-4 w-4 text-danger" />
        </Button>
      )}
      {canDelete && onDelete && (
        <Button size="sm" variant="ghost" onClick={() => onDelete(id)} title="Eliminar">
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      )}
    </div>
  );
}
