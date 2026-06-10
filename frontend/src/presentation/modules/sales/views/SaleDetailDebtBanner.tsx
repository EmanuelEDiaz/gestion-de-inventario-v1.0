'use client';

import Link from 'next/link';

interface SaleDetailDebtBannerProps {
  debtId: string;
  customerId: string;
}

export function SaleDetailDebtBanner({ customerId }: SaleDetailDebtBannerProps) {
  void customerId;
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-center justify-between text-sm">
      <span className="text-yellow-800">Deuda generada por esta venta</span>
      <Link
        href={`/customers/${customerId}/debts`}
        className="text-primary underline hover:text-primary/80 font-medium"
        title="Ver deuda vinculada a esta venta"
      >
        Ver deuda
      </Link>
    </div>
  );
}
