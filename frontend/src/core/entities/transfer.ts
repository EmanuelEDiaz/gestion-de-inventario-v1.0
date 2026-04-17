/**
 * Entidad de dominio: Transferencia entre almacenes.
 */
export interface Transfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouseName?: string;
  toWarehouseId: string;
  toWarehouseName?: string;
  status: TransferStatus;
  notes?: string;
  transferDate: string;
  receivedDate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  lines: TransferLine[];
}

export interface TransferLine {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  receivedQty: number;
  sortOrder: number;
}

export type TransferStatus = 
  | 'DRAFT' 
  | 'CONFIRMED' 
  | 'IN_TRANSIT' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface CreateTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  notes?: string;
  transferDate?: string;
  lines: { productId: string; quantity: number }[];
}

export interface UpdateTransferRequest {
  fromWarehouseId?: string;
  toWarehouseId?: string;
  notes?: string;
  transferDate?: string;
  lines: { productId: string; quantity: number }[];
}

// Helpers
export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmada',
  IN_TRANSIT: 'En Tránsito',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};
