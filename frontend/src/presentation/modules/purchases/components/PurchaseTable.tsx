'use client';

import { Purchase, getPurchaseStatusLabel, getPurchaseStatusColor } from '@/core/entities/purchase';
import { formatCurrency, formatDateShort } from '@/presentation/shared/lib/utils';

interface PurchaseTableProps {
  purchases: Purchase[];
  onRowClick?: (purchase: Purchase) => void;
  onConfirm?: (purchase: Purchase) => void;
  onReceive?: (purchase: Purchase) => void;
  onCancel?: (purchase: Purchase) => void;
}

export function PurchaseTable({ 
  purchases, 
  onRowClick,
  onConfirm,
  onReceive,
  onCancel 
}: PurchaseTableProps) {
  if (purchases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay compras registradas
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Número</th>
            <th className="text-left p-3 font-medium">Fecha</th>
            <th className="text-left p-3 font-medium">Proveedor</th>
            <th className="text-left p-3 font-medium">Almacén</th>
            <th className="text-left p-3 font-medium">Estado</th>
            <th className="text-right p-3 font-medium">Total</th>
            <th className="text-center p-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr 
              key={purchase.id}
              className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => onRowClick?.(purchase)}
            >
              <td className="p-3 font-mono">{purchase.purchaseNumber}</td>
              <td className="p-3">{formatDateShort(purchase.purchaseDate)}</td>
              <td className="p-3">{purchase.supplierName || '-'}</td>
              <td className="p-3">{purchase.warehouseName || purchase.warehouseId}</td>
              <td className="p-3">
                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getPurchaseStatusColor(purchase.status)}`}>
                  {getPurchaseStatusLabel(purchase.status)}
                </span>
              </td>
              <td className="p-3 text-right font-medium">
                {formatCurrency(purchase.total, purchase.currencyCode)}
              </td>
              <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center gap-1">
                  {purchase.status === 'DRAFT' && onConfirm && (
                    <button
                      onClick={() => onConfirm(purchase)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Confirmar
                    </button>
                  )}
                  {purchase.status === 'CONFIRMED' && onReceive && (
                    <button
                      onClick={() => onReceive(purchase)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Recibir
                    </button>
                  )}
                  {(purchase.status === 'DRAFT' || purchase.status === 'CONFIRMED') && onCancel && (
                    <button
                      onClick={() => onCancel(purchase)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
