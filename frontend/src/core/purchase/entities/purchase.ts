/**
 * Entidad de dominio: Compra
 */
export type PurchaseStatus = 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string | null;
  supplierName: string | null;
  warehouseId: string;
  warehouseName: string | null;
  status: PurchaseStatus;
  currencyCode: string;
  exchangeRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  purchaseDate: string;
  receivedDate: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines: PurchaseLine[];
}

export interface PurchaseLine {
  id: string;
  productId: string;
  productName: string | null;
  productSku: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty: number;
  sortOrder: number;
}

export interface PurchaseFilter {
  supplierId?: string;
  warehouseId?: string;
  status?: PurchaseStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface CreatePurchaseInput {
  warehouseId: string;
  supplierId?: string;
  currencyCode?: string;
  notes?: string;
  purchaseDate?: string;
  lines: {
    productId: string;
    quantity: number;
    unitCost: number;
  }[];
}

export const getPurchaseStatusLabel = (status: PurchaseStatus): string => {
  const labels: Record<PurchaseStatus, string> = {
    DRAFT: 'Borrador',
    CONFIRMED: 'Confirmada',
    RECEIVED: 'Recibida',
    CANCELLED: 'Cancelada'
  };
  return labels[status];
};

export const getPurchaseStatusColor = (status: PurchaseStatus): string => {
  const colors: Record<PurchaseStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    RECEIVED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700'
  };
  return colors[status];
};
