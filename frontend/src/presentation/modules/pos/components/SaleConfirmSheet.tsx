'use client';

import type { PaymentMode } from '@/core/sale/entities/sale';
import type { CartLine } from '../hooks/usePosCart';
import { ShoppingCart, X } from 'lucide-react';
import { SaleSummaryPanel } from './SaleSummaryPanel';
import { SaleConfirmActions } from './SaleConfirmActions';
import { SaleReceiptPreview } from './SaleReceiptPreview';

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
        <SaleSummaryPanel lines={lines} currencyCode={currencyCode} />
        <SaleReceiptPreview paymentMode={paymentMode} total={total} customerName={customerName} currencyCode={currencyCode} />
        <SaleConfirmActions onConfirm={onConfirm} confirmDisabled={confirmDisabled} isSubmitting={isSubmitting} confirmLabel={confirmLabel} isFiar={isFiar} />
      </div>
    </div>
  );
}
