'use client';

import type { Sale, PaymentMode, SaleStatus } from '@/core/entities/sale';
import Link from 'next/link';
import { formatCurrency } from '@/presentation/shared/lib/utils';
import { statusColors } from '@/presentation/shared/lib/colors';

interface SaleDetailViewProps {
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

export function SaleDetailView({ sale }: SaleDetailViewProps) {
  const status = STATUS_LABEL[sale.status] ?? { label: sale.status, classes: 'bg-gray-100' };
  const mode = sale.paymentMode ? MODE_LABEL[sale.paymentMode] : null;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
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

      {/* Info general */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
        {sale.customerName && (
          <div>
            <span className="text-gray-500">Cliente</span>
            <p className="font-medium">{sale.customerName}</p>
          </div>
        )}
        <div>
          <span className="text-gray-500">Almacén</span>
          <p className="font-medium">{sale.warehouseName ?? sale.warehouseId}</p>
        </div>
        {sale.createdBy && (
          <div>
            <span className="text-gray-500">Creado por</span>
            <p className="font-medium">{sale.createdBy}</p>
          </div>
        )}
        {sale.notes && (
          <div className="sm:col-span-2">
            <span className="text-gray-500">Notas</span>
            <p className="font-medium whitespace-pre-wrap">{sale.notes}</p>
          </div>
        )}
      </div>

      {/* Deuda vinculada */}
      {sale.debtId && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-yellow-800">Deuda generada por esta venta</span>
          <Link
            href={`/customers/${sale.customerId}/debts`}
            className="text-primary underline hover:text-primary/80 font-medium"
            title="Ver deuda vinculada a esta venta"
          >
            Ver deuda
          </Link>
        </div>
      )}

      {/* Líneas */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Producto</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Cant.</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">P.Unit.</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Dto%</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sale.lines.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3">
                  <span className="font-medium">{l.productName ?? '—'}</span>
                  {l.productSku && <span className="ml-2 text-xs text-gray-400">{l.productSku}</span>}
                </td>
                <td className="px-4 py-3 text-right">{l.quantity}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(l.unitPrice, sale.currencyCode)}</td>
                <td className="px-4 py-3 text-right">{l.discount}%</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(l.totalPrice, sale.currencyCode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(sale.subtotal, sale.currencyCode)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-danger">
              <span>Descuento</span>
              <span>-{formatCurrency(sale.discountAmount, sale.currencyCode)}</span>
            </div>
          )}
          {sale.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Impuesto</span>
              <span>{formatCurrency(sale.taxAmount, sale.currencyCode)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t pt-1">
            <span>Total</span>
            <span>{formatCurrency(sale.total, sale.currencyCode)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
