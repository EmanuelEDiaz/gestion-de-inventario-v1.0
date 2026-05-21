'use client';

import type { Sale, PaymentMode, SaleStatus } from '@/core/sale/entities/sale';
import { statusColors } from '@/presentation/shared/lib/colors';

interface SaleDetailHeaderProps {
  sale: Sale;
}

const STATUS_LABEL: Record<SaleStatus, { label: string; classes: string }> = {
  DRAFT: { label: 'Borrador', classes: statusColors.inactive },
  CONFIRMED: { label: 'Confirmada', classes: statusColors.info },
  DELIVERED: { label: 'Entregada', classes: statusColors.success },
  CANCELLED: { label: 'Cancelada', classes: statusColors.destructive },
};

const MODE_LABEL: Record<PaymentMode, { label: string; classes: string }> = {
  IMMEDIATE: { label: 'Cobrado', classes: statusColors.success },
  CREDIT: { label: 'Fiado (Crédito)', classes: statusColors.warning },
  RESERVE: { label: 'Reserva', classes: 'bg-purple-100 text-purple-800' },
};

export function SaleDetailHeader({ sale }: SaleDetailHeaderProps) {
  const status = STATUS_LABEL[sale.status] ?? { label: sale.status, classes: 'bg-gray-100' };
  const mode = sale.paymentMode ? MODE_LABEL[sale.paymentMode] : null;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">Venta #{sale.saleNumber}</h2>
        <p className="text-sm text-gray-500">{new Date(sale.saleDate).toLocaleString('es')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}
          title="Estado de la venta">
          {status.label}
        </span>
        {mode && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mode.classes}`}
            title="Modo de pago">
            {mode.label}
          </span>
        )}
      </div>
    </div>
  );
}
