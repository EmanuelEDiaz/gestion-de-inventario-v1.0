/**
 * Entidad de dominio: Balance de Stock
 */
export interface StockBalance {
  warehouseId: string;
  productId: string;
  warehouseName?: string;
  productName?: string;
  productSku?: string;
  onHand: number;
  reserved: number;
  available: number;
  avgCost: number | null;
  totalValue: number | null;
  updatedAt: string;
}

export interface StockFilter {
  warehouseId?: string;
  productId?: string;
  categoryId?: string;
  belowReorderPoint?: boolean;
  outOfStock?: boolean;
  page?: number;
  size?: number;
}
