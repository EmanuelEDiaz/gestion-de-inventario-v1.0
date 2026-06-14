import { z } from 'zod';
import {
  transferFromWarehouseId, transferToWarehouseId,
  transferNotes, transferDate,
  transferLineProductId, transferLineQuantity,
} from './fields/commerce/transfer-fields';

const transferLineSchema = z.object({
  productId: transferLineProductId(),
  quantity: transferLineQuantity(),
});

export const createTransferSchema = z.object({
  fromWarehouseId: transferFromWarehouseId(),
  toWarehouseId: transferToWarehouseId(),
  notes: transferNotes(),
  transferDate: transferDate(),
  lines: z.array(transferLineSchema).min(1, 'Debe tener al menos un producto'),
}).refine(
  (data) => data.fromWarehouseId !== data.toWarehouseId,
  { message: 'La bodega origen y destino deben ser diferentes', path: ['toWarehouseId'] }
);

export const updateTransferSchema = createTransferSchema.partial();

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
