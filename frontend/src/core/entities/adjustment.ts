/**
 * Adjustment entity (core/entities).
 * Tipos de ajuste de inventario.
 */

export type AdjustmentType = 'COUNT' | 'DAMAGE' | 'THEFT' | 'EXPIRY' | 'OTHER';
export type AdjustmentStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface AdjustmentLine {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  systemQty: number;
  countedQty: number;
  difference: number;
  unitCost?: number;
}

export interface Adjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  warehouseName?: string;
  type: AdjustmentType;
  status: AdjustmentStatus;
  reason?: string;
  notes?: string;
  adjustmentDate: string;
  createdBy?: string;
  createdAt: string;
  lines: AdjustmentLine[];
}

export interface CreateAdjustmentData {
  warehouseId: string;
  type: AdjustmentType;
  reason?: string;
  notes?: string;
  lines: Array<{
    productId: string;
    systemQty: number;
    countedQty: number;
    unitCost?: number;
  }>;
}

export interface UpdateAdjustmentData {
  type: AdjustmentType;
  reason?: string;
  notes?: string;
  lines: Array<{
    productId: string;
    systemQty: number;
    countedQty: number;
    unitCost?: number;
  }>;
}

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  COUNT: 'Conteo físico',
  DAMAGE: 'Daños',
  THEFT: 'Pérdida/Robo',
  EXPIRY: 'Vencimiento',
  OTHER: 'Otro'
};

export const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentStatus, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado'
};

export const ADJUSTMENT_STATUS_COLORS: Record<AdjustmentStatus, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};
