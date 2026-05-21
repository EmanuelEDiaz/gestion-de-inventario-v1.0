'use client';

import { Button } from '@/presentation/shared/components/ui/Button';

interface SaleConfirmActionsProps {
  onConfirm: () => void;
  confirmDisabled: boolean;
  isSubmitting: boolean;
  confirmLabel: string;
  isFiar: boolean;
}

export function SaleConfirmActions({ onConfirm, confirmDisabled, isSubmitting, confirmLabel, isFiar }: SaleConfirmActionsProps) {
  return (
    <div className="px-5 pb-5">
      <Button
        className="w-full"
        onClick={onConfirm}
        disabled={confirmDisabled}
        title={confirmDisabled && isFiar ? 'Debes seleccionar un cliente para usar Fiado o Reserva' : 'Confirmar venta'}
      >
        {isSubmitting ? 'Procesando...' : confirmLabel}
      </Button>
    </div>
  );
}
