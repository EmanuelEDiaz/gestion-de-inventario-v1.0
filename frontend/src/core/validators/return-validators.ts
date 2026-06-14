import { z } from 'zod';
import {
  returnType, returnWarehouseId, returnOriginalDocumentId,
  returnReason, returnNotes, returnDate,
  returnLineProductId, returnLineQuantity,
  returnLineUnitPrice, returnLineUnitCost,
} from './fields/commerce/return-fields';

const returnLineSchema = z.object({
  productId: returnLineProductId(),
  quantity: returnLineQuantity(),
  unitPrice: returnLineUnitPrice(),
  unitCost: returnLineUnitCost(),
});

export const createReturnSchema = z.object({
  type: returnType,
  warehouseId: returnWarehouseId(),
  originalDocumentId: returnOriginalDocumentId(),
  reason: returnReason(),
  notes: returnNotes(),
  returnDate: returnDate(),
  lines: z.array(returnLineSchema).min(1, 'Debe tener al menos un producto'),
});

export const updateReturnSchema = createReturnSchema.partial();

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type UpdateReturnInput = z.infer<typeof updateReturnSchema>;
