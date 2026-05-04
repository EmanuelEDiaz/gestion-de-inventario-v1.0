export type DebtStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export type DebtPaymentMethod = 'CASH' | 'TRANSFER' | 'PRODUCT' | 'OTHER';

export interface CustomerDebt {
  id: string;
  customerId: string;
  saleId: string;
  originalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  currencyCode: string;
  status: DebtStatus;
  description: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDebtData {
  description?: string;
  dueDate?: string;
  notes?: string;
}

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Pago parcial',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
};

export const DEBT_STATUS_COLORS: Record<DebtStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PARTIAL: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};
