'use client';

import type { Sale } from '@/core/entities/sale';

interface SaleDetailInfoProps {
  sale: Sale;
}

export function SaleDetailInfo({ sale }: SaleDetailInfoProps) {
  return (
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
  );
}
