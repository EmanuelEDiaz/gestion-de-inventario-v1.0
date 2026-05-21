'use client';

import type { Sale } from '@/core/sale/entities/sale';
import { SaleDetailHeader } from './SaleDetailHeader';
import { SaleDetailInfo } from './SaleDetailInfo';
import { SaleDetailDebtBanner } from './SaleDetailDebtBanner';
import { SaleDetailItems } from './SaleDetailItems';
import { SaleDetailSummary } from './SaleDetailSummary';

interface SaleDetailViewProps {
  sale: Sale;
}

export function SaleDetailView({ sale }: SaleDetailViewProps) {
  return (
    <div className="space-y-6">
      <SaleDetailHeader sale={sale} />
      <SaleDetailInfo sale={sale} />
      {sale.debtId && sale.customerId && <SaleDetailDebtBanner debtId={sale.debtId} customerId={sale.customerId} />}
      <SaleDetailItems sale={sale} />
      <SaleDetailSummary sale={sale} />
    </div>
  );
}
