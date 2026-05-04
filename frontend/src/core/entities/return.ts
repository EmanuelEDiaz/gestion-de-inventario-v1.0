/**
 * Return entity (core/entities).
 * Devoluciones de venta y compra.
 */

export type ReturnType = 'SALE_RETURN' | 'PURCHASE_RETURN';
export type ReturnStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ReturnLine {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Return {
  id: string;
  returnNumber: string;
  type: ReturnType;
  warehouseId: string;
  warehouseName?: string;
  originalDocumentId?: string;
  status: ReturnStatus;
  reason?: string;
  notes?: string;
  returnDate: string;
  totalAmount: number;
  createdBy?: string;
  createdAt: string;
  lines: ReturnLine[];
}

export interface CreateReturnData {
  type: ReturnType;
  warehouseId: string;
  originalDocumentId?: string;
  reason?: string;
  notes?: string;
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
  }>;
}

export interface UpdateReturnData {
  reason?: string;
  notes?: string;
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
  }>;
}

export const RETURN_TYPE_LABELS: Record<ReturnType, string> = {
  SALE_RETURN: 'Devolución de venta',
  PURCHASE_RETURN: 'Devolución a proveedor'
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada'
};

export const RETURN_STATUS_COLORS: Record<ReturnStatus, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};
