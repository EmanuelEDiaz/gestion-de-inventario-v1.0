'use client';

import type { PaymentMode } from '@/core/sale/entities/sale';
import { formatCurrency } from '@/presentation/shared/lib/utils';

const MODE_LABEL: Record<PaymentMode, string> = {
  IMMEDIATE: 'Cobrar ahora',
  CREDIT: 'Fiado (Crédito)',
  RESERVE: 'Reserva',
};

interface SaleReceiptPreviewProps {
  paymentMode: PaymentMode;
  total: number;
  customerName?: string | null;
  currencyCode: string;
}

export function SaleReceiptPreview({ paymentMode, total, customerName, currencyCode }: SaleReceiptPreviewProps) {
  return (
    <>
      <div className="px-5 py-3 border-t flex justify-between items-center">
        <span className="text-sm text-gray-500">Modo</span>
        <span className="text-sm font-medium">{MODE_LABEL[paymentMode]}</span>
      </div>
      {customerName && (
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
    </>
  );
}
