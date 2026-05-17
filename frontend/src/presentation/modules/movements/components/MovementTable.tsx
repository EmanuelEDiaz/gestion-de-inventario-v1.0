'use client';

import { useMemo } from 'react';
import { InventoryMovement, getMovementTypeLabel, isInboundMovement } from '@/core/entities/inventory-movement';
import { formatCurrency, formatDate } from '@/presentation/shared/lib/utils';
import { GenericTable, type Column } from '@/presentation/shared/components/GenericTable';

interface MovementTableProps {
  movements: InventoryMovement[];
  showWarehouse?: boolean;
  showProduct?: boolean;
  onRowClick?: (movement: InventoryMovement) => void;
}

export function MovementTable({ movements, showWarehouse = true, showProduct = true, onRowClick }: MovementTableProps) {
  const columns = useMemo<Column<InventoryMovement>[]>(() => {
    const cols: Column<InventoryMovement>[] = [
      { key: 'occurredAt', label: 'Fecha', render: (_, r) => <span className="text-sm">{formatDate(r.occurredAt)}</span> },
      {
        key: 'movementType', label: 'Tipo',
        render: (_, r) => {
          const isInbound = isInboundMovement(r.movementType);
          return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              isInbound
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isInbound ? '↑' : '↓'} {getMovementTypeLabel(r.movementType)}
            </span>
          );
        },
      },
    ];
    if (showWarehouse) cols.push({ key: 'warehouseName', label: 'Almacén', render: (_, r) => <span>{r.warehouseName || r.warehouseId}</span> });
    if (showProduct) cols.push({ key: 'productName', label: 'Producto', render: (_, r) => <span>{r.productName || r.productId}</span> });
    cols.push(
      {
        key: 'quantity', label: 'Cantidad', className: 'text-right',
        render: (_, r) => {
          const isInbound = isInboundMovement(r.movementType);
          return <span className={`font-medium ${isInbound ? 'text-green-600' : 'text-red-600'}`}>{isInbound ? '+' : ''}{r.quantity.toFixed(2)}</span>;
        },
      },
      { key: 'unitCost', label: 'Costo Unit.', className: 'text-right', render: (_, r) => <span>{r.unitCost != null ? formatCurrency(r.unitCost) : '-'}</span> },
      { key: 'balanceAfter', label: 'Balance', className: 'text-right', render: (_, r) => <span className="font-medium">{r.balanceAfter.toFixed(2)}</span> },
      { key: 'sourceDocType', label: 'Documento', render: (_, r) => <span className="text-sm font-mono">{r.sourceDocType}-{r.sourceDocId.slice(0, 8)}</span> },
    );
    return cols;
  }, [showWarehouse, showProduct]);

  return (
    <GenericTable data={movements} columns={columns}
      onRowClick={onRowClick} emptyMessage="No hay movimientos registrados" />
  );
}
