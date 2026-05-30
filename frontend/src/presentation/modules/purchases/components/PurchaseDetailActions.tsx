'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { type Purchase } from '@/core/purchase/entities/purchase';

interface PurchaseDetailActionsProps {
  purchase: Purchase;
  onConfirm?: () => void;
  onReceive?: () => void;
  onCancel?: () => void;
}

export function PurchaseDetailActions({ purchase, onConfirm, onReceive, onCancel }: PurchaseDetailActionsProps) {
  return (
    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
      {purchase.status === 'DRAFT' && onConfirm && (
        <TooltipWrapper content="Confirmar compra" side="top">
          <button onClick={onConfirm} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Confirmar Compra
          </button>
        </TooltipWrapper>
      )}
      {purchase.status === 'CONFIRMED' && onReceive && (
        <TooltipWrapper content="Registrar recepción de mercancía" side="top">
          <button onClick={onReceive} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Marcar como Recibida
          </button>
        </TooltipWrapper>
      )}
      {(purchase.status === 'DRAFT' || purchase.status === 'CONFIRMED') && onCancel && (
        <TooltipWrapper content="Cancelar compra" side="top">
          <button onClick={onCancel} className="px-4 py-2 bg-danger/10 text-danger rounded hover:bg-danger/20">
            Cancelar Compra
          </button>
        </TooltipWrapper>
      )}
    </div>
  );
}
