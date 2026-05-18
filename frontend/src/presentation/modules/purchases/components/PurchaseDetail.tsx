'use client';

import { Purchase, getPurchaseStatusLabel, getPurchaseStatusColor } from '@/core/entities/purchase';
import { formatCurrency, formatDateShort } from '@/presentation/shared/lib/utils';

interface PurchaseDetailProps {
  purchase: Purchase;
  onConfirm?: () => void;
  onReceive?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function PurchaseDetail({ 
  purchase, 
  onConfirm, 
  onReceive, 
  onCancel,
  onClose 
}: PurchaseDetailProps) {
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold">{purchase.purchaseNumber}</h2>
          <p className="text-sm text-muted-foreground">
            Fecha: {formatDateShort(purchase.purchaseDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPurchaseStatusColor(purchase.status)}`}>
            {getPurchaseStatusLabel(purchase.status)}
          </span>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded"
            >
              ✕
            </button>
          )}
        </div>
      </div>

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

      {purchase.notes && (
        <div className="mb-6 p-3 bg-muted/50 rounded">
          <p className="text-sm text-muted-foreground">Notas</p>
          <p>{purchase.notes}</p>
        </div>
      )}

      <div className="border-t pt-4">
        <h3 className="font-medium mb-3">Líneas de Compra</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-2 text-sm">Producto</th>
              <th className="text-right p-2 text-sm">Cantidad</th>
              <th className="text-right p-2 text-sm">Costo Unit.</th>
              <th className="text-right p-2 text-sm">Total</th>
            </tr>
          </thead>
          <tbody>
            {purchase.lines.map((line) => (
              <tr key={line.id} className="border-b">
                <td className="p-2">
                  <div>{line.productName || line.productId}</div>
                  {line.productSku && (
                    <div className="text-xs text-muted-foreground font-mono">{line.productSku}</div>
                  )}
                </td>
                <td className="p-2 text-right">{line.quantity}</td>
                <td className="p-2 text-right">{formatCurrency(line.unitCost, purchase.currencyCode)}</td>
                <td className="p-2 text-right font-medium">{formatCurrency(line.totalCost, purchase.currencyCode)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2">
              <td colSpan={3} className="p-2 text-right font-medium">Subtotal</td>
              <td className="p-2 text-right">{formatCurrency(purchase.subtotal, purchase.currencyCode)}</td>
            </tr>
            {purchase.taxAmount > 0 && (
              <tr>
                <td colSpan={3} className="p-2 text-right font-medium">Impuestos</td>
                <td className="p-2 text-right">{formatCurrency(purchase.taxAmount, purchase.currencyCode)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="p-2 text-right font-bold text-lg">Total</td>
              <td className="p-2 text-right font-bold text-lg">{formatCurrency(purchase.total, purchase.currencyCode)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
        {purchase.status === 'DRAFT' && onConfirm && (
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirmar Compra
          </button>
        )}
        {purchase.status === 'CONFIRMED' && onReceive && (
          <button
            onClick={onReceive}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Marcar como Recibida
          </button>
        )}
        {(purchase.status === 'DRAFT' || purchase.status === 'CONFIRMED') && onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-danger/10 text-danger rounded hover:bg-danger/20"
          >
            Cancelar Compra
          </button>
        )}
      </div>
    </div>
  );
}
