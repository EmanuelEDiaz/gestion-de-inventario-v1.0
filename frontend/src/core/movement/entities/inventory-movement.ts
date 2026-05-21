/**
 * Entidad de dominio: Movimiento de Inventario
 */
export type MovementType = 
  | 'PURCHASE'
  | 'SALE'
  | 'SALE_RETURN'
  | 'PURCHASE_RETURN'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'INITIAL';

export interface InventoryMovement {
  id: string;
  warehouseId: string;
  productId: string;
  warehouseName?: string;
  productName?: string;
  productSku?: string;
  movementType: MovementType;
  quantity: number;
  unitCost: number | null;
  unitPrice: number | null;
  totalCost: number | null;
  totalPrice: number | null;
  currencyCode: string;
  exchangeRate: number;
  balanceAfter: number;
  sourceDocType: string;
  sourceDocId: string;
  notes: string | null;
  occurredAt: string;
  createdBy: string | null;
  createdAt: string;
}

export interface MovementFilter {
  warehouseId?: string;
  productId?: string;
  movementType?: MovementType;
  sourceDocType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export const isInboundMovement = (type: MovementType): boolean => {
  return ['PURCHASE', 'SALE_RETURN', 'ADJUSTMENT_IN', 'TRANSFER_IN', 'INITIAL'].includes(type);
};

export const getMovementTypeLabel = (type: MovementType): string => {
  const labels: Record<MovementType, string> = {
    PURCHASE: 'Compra',
    SALE: 'Venta',
    SALE_RETURN: 'Devolución de Venta',
    PURCHASE_RETURN: 'Devolución de Compra',
    ADJUSTMENT_IN: 'Ajuste Entrada',
    ADJUSTMENT_OUT: 'Ajuste Salida',
    TRANSFER_IN: 'Transferencia Entrada',
    TRANSFER_OUT: 'Transferencia Salida',
    INITIAL: 'Inventario Inicial'
  };
  return labels[type];
};
