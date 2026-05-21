/**
 * Entidad de dominio: Venta
 */
export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export type PaymentMode = 'IMMEDIATE' | 'CREDIT' | 'RESERVE';

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string | null;
  customerName: string | null;
  warehouseId: string;
  warehouseName: string | null;
  status: SaleStatus;
  currencyCode: string;
  exchangeRate: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  saleDate: string;
  paymentMode?: PaymentMode;
  debtId?: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines: SaleLine[];
}

export interface SaleLine {
  id: string;
  productId: string;
  productName: string | null;
  productSku: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  sortOrder: number;
}

export interface SaleFilter {
  customerId?: string;
  warehouseId?: string;
  status?: SaleStatus;
  fromDate?: string;
  toDate?: string;
}

export interface CreateSaleInput {
  warehouseId: string;
  customerId?: string;
  currencyCode?: string;
  notes?: string;
  saleDate?: string;
  paymentMode?: PaymentMode;
  lines: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
}

export const getSaleStatusLabel = (status: SaleStatus): string => {
  const labels: Record<SaleStatus, string> = {
    DRAFT: 'Borrador',
    CONFIRMED: 'Confirmada',
    DELIVERED: 'Entregada',
    CANCELLED: 'Cancelada'
  };
  return labels[status];
};

export const getSaleStatusColor = (status: SaleStatus): string => {
  const colors: Record<SaleStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    CONFIRMED: 'bg-info/10 text-info',
    DELIVERED: 'bg-success/10 text-success',
    CANCELLED: 'bg-danger/10 text-danger'
  };
  return colors[status];
};
