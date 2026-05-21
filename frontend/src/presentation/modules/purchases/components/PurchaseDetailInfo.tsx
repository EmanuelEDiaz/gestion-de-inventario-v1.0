'use client';

import { type Purchase } from '@/core/purchase/entities/purchase';
import { formatDateShort } from '@/presentation/shared/lib/utils';

interface PurchaseDetailInfoProps {
  purchase: Purchase;
}

export function PurchaseDetailInfo({ purchase }: PurchaseDetailInfoProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div>
        <p className="text-sm text-muted-foreground">Proveedor</p>
        <p className="font-medium">{purchase.supplierName || 'Sin proveedor'}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Almacén</p>
        <p className="font-medium">{purchase.warehouseName || purchase.warehouseId}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Moneda</p>
        <p className="font-medium">{purchase.currencyCode}</p>
      </div>
      {purchase.receivedDate && (
        <div>
          <p className="text-sm text-muted-foreground">Fecha Recepción</p>
          <p className="font-medium">{formatDateShort(purchase.receivedDate)}</p>
        </div>
      )}
    </div>
  );
}
