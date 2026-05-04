'use client';

import { InventoryMovement, getMovementTypeLabel, isInboundMovement } from '@/core/entities/inventory-movement';
import { formatCurrency, formatDate } from '@/presentation/shared/lib/utils';

interface MovementTableProps {
  movements: InventoryMovement[];
  showWarehouse?: boolean;
  showProduct?: boolean;
  onRowClick?: (movement: InventoryMovement) => void;
}

export function MovementTable({ 
  movements, 
  showWarehouse = true,
  showProduct = true,
  onRowClick 
}: MovementTableProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay movimientos registrados
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Fecha</th>
            <th className="text-left p-3 font-medium">Tipo</th>
            {showWarehouse && <th className="text-left p-3 font-medium">Almacén</th>}
            {showProduct && <th className="text-left p-3 font-medium">Producto</th>}
            <th className="text-right p-3 font-medium">Cantidad</th>
            <th className="text-right p-3 font-medium">Costo Unit.</th>
            <th className="text-right p-3 font-medium">Balance</th>
            <th className="text-left p-3 font-medium">Documento</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => {
            const isInbound = isInboundMovement(movement.movementType);
            return (
              <tr 
                key={movement.id}
                className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onRowClick?.(movement)}
              >
                <td className="p-3 text-sm">
                  {formatDate(movement.occurredAt)}
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    isInbound 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {isInbound ? '↑' : '↓'} {getMovementTypeLabel(movement.movementType)}
                  </span>
                </td>
                {showWarehouse && (
                  <td className="p-3">{movement.warehouseName || movement.warehouseId}</td>
                )}
                {showProduct && (
                  <td className="p-3">{movement.productName || movement.productId}</td>
                )}
                <td className={`p-3 text-right font-medium ${
                  isInbound ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isInbound ? '+' : ''}{movement.quantity.toFixed(2)}
                </td>
                <td className="p-3 text-right">
                  {movement.unitCost != null ? formatCurrency(movement.unitCost) : '-'}
                </td>
                <td className="p-3 text-right font-medium">
                  {movement.balanceAfter.toFixed(2)}
                </td>
                <td className="p-3 text-sm font-mono">
                  {movement.sourceDocType}-{movement.sourceDocId.slice(0, 8)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
