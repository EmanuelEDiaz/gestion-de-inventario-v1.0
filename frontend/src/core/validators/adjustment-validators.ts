import { z } from 'zod';
import {
  adjustmentWarehouseId, adjustmentType, adjustmentReason,
  adjustmentNotes, adjustmentDate,
  adjustmentLineProductId, adjustmentLineSystemQty,
  adjustmentLineCountedQty, adjustmentLineUnitCost,
} from './fields/commerce/adjustment-fields';

const adjustmentLineSchema = z.object({
  productId: adjustmentLineProductId(),
  systemQty: adjustmentLineSystemQty(),
  countedQty: adjustmentLineCountedQty(),
  unitCost: adjustmentLineUnitCost(),
});

export const createAdjustmentSchema = z.object({
  warehouseId: adjustmentWarehouseId(),
  type: adjustmentType,
  reason: adjustmentReason(),
  notes: adjustmentNotes(),
  adjustmentDate: adjustmentDate(),
  lines: z.array(adjustmentLineSchema).min(1, 'Debe tener al menos un producto'),
});

export const updateAdjustmentSchema = createAdjustmentSchema.partial();

export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
export type UpdateAdjustmentInput = z.infer<typeof updateAdjustmentSchema>;
