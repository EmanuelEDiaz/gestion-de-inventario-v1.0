'use client';

import type { PaymentMode } from '@/core/sale/entities/sale';
import type { CartLine } from '../hooks/usePosCart';
import { Button } from '@/presentation/shared/components/ui/Button';
import { formatCurrency } from '@/presentation/shared/lib/utils';
import { ShoppingCart, X } from 'lucide-react';

interface SaleConfirmSheetProps {
  open: boolean;
  lines: CartLine[];
  total: number;
  paymentMode: PaymentMode;
  customerName?: string | null;
  canFiar: boolean;
  isSubmitting: boolean;
  currencyCode?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const MODE_LABEL: Record<PaymentMode, string> = {
  IMMEDIATE: 'Cobrar ahora',
  CREDIT: 'Fiado (Crédito)',
  RESERVE: 'Reserva',
};

export function SaleConfirmSheet({
  open,
  lines,
  total,
  paymentMode,
  customerName,
  canFiar,
  isSubmitting,
  currencyCode = 'USD',
  onConfirm,
  onClose,
}: SaleConfirmSheetProps) {
  if (!open) return null;

  const isFiar = paymentMode === 'CREDIT' || paymentMode === 'RESERVE';
  const confirmDisabled = isSubmitting || (isFiar && !canFiar);
  const confirmLabel = isFiar
    ? canFiar
      ? `FIAR a ${customerName}`
      : 'Selecciona un cliente'
    : 'COBRAR';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            <span className="font-semibold text-gray-800">Confirmar venta</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            title="Cerrar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-3 space-y-1 max-h-52 overflow-y-auto">
          {lines.map((l) => (
            <div key={l.productId} className="flex justify-between text-sm">
              <span className="truncate text-gray-700" title={l.productName}>
                {l.productName} × {l.quantity}
              </span>
              <span className="ml-2 font-medium shrink-0">
                {formatCurrency(l.quantity * l.unitPrice * (1 - l.discount / 100), currencyCode)}
              </span>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t flex justify-between items-center">
          <span className="text-sm text-gray-500">Modo</span>
          <span className="text-sm font-medium">{MODE_LABEL[paymentMode]}</span>
        </div>

        {isFiar && customerName && (
          <div className="px-5 pb-1 flex justify-between items-center">
            <span className="text-sm text-gray-500">Cliente</span>
            <span className="text-sm font-medium text-blue-700">{customerName}</span>
          </div>
        )}

        <div className="px-5 pb-3 flex justify-between items-center">
          <span className="text-base font-semibold">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(total, currencyCode)}
          </span>
        </div>

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
      </div>
    </div>
  );
}
