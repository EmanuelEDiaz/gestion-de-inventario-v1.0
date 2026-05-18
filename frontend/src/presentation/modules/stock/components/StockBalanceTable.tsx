'use client';

import { useMemo } from 'react';
import { StockBalance } from '@/core/entities/stock-balance';
import { formatCurrency } from '@/presentation/shared/lib/utils';
import { GenericTable, type Column } from '@/presentation/shared/components/GenericTable';

interface StockBalanceTableProps {
  balances: StockBalance[];
  showWarehouse?: boolean;
  showProduct?: boolean;
  onRowClick?: (balance: StockBalance) => void;
}

export function StockBalanceTable({ balances, showWarehouse = true, showProduct = true, onRowClick }: StockBalanceTableProps) {
  const columns = useMemo<Column<StockBalance & { id: string }>[]>(() => {
    const cols: Column<StockBalance & { id: string }>[] = [];
    if (showWarehouse) cols.push({ key: 'warehouseName', label: 'Almacén', render: (_, r) => <span>{r.warehouseName || r.warehouseId}</span> });
    if (showProduct) cols.push({ key: 'productName', label: 'Producto', render: (_, r) => <span>{r.productName || r.productId}</span> });
    cols.push(
      { key: 'productSku', label: 'SKU', render: (_, r) => <span className="font-mono text-sm">{r.productSku || '-'}</span> },
      {
        key: 'available', label: 'Disponible', className: 'text-right',
        render: (_, r) => <span className={`font-medium ${r.available <= 0 ? 'text-danger' : ''}`}>{r.available.toFixed(2)}</span>,
      },
      { key: 'reserved', label: 'Reservado', className: 'text-right', render: (_, r) => <span className="text-muted-foreground">{r.reserved.toFixed(2)}</span> },
      { key: 'onHand', label: 'En Mano', className: 'text-right', render: (_, r) => <span>{r.onHand.toFixed(2)}</span> },
      { key: 'avgCost', label: 'Costo Prom.', className: 'text-right', render: (_, r) => <span>{r.avgCost != null ? formatCurrency(r.avgCost) : '-'}</span> },
      { key: 'totalValue', label: 'Valor Total', className: 'text-right', render: (_, r) => <span className="font-medium">{r.totalValue != null ? formatCurrency(r.totalValue) : '-'}</span> },
    );
    return cols;
  }, [showWarehouse, showProduct]);

  const data = useMemo(() =>
    balances.map(b => ({ ...b, id: `${b.warehouseId}-${b.productId}` })),
    [balances]
  );

  return (
    <GenericTable data={data} columns={columns}
      onRowClick={onRowClick} emptyMessage="No hay balances de stock disponibles" />
  );
}
