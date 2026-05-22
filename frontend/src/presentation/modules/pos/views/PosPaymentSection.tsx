'use client';

import { Plus } from '@/presentation/shared/components/ui/icon-mapping';
import { Button } from '@/presentation/shared/components/ui/Button';
import { formatCurrency } from '@/presentation/shared/lib/utils';

interface PosPaymentSectionProps {
  total: number;
  warehouseId: string | null;
  onConfirm: () => void;
}

export function PosPaymentSection({ total, warehouseId, onConfirm }: PosPaymentSectionProps) {
  return (
    <div className="mt-auto space-y-2">
      <div className="flex justify-between font-semibold text-base border-t pt-2">
        <span>Total</span>
        <span>{formatCurrency(total, 'USD')}</span>
      </div>
      <Button
        className="w-full"
        onClick={onConfirm}
        disabled={!warehouseId}
        title="Abrir panel de confirmación"
      >
        <Plus className="h-4 w-4 mr-1" />
        Confirmar venta
      </Button>
    </div>
  );
}
