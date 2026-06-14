import { z } from 'zod';
import {
  purchaseWarehouseId, purchaseSupplierId, purchaseCurrencyCode,
  purchaseNotes, purchaseDate,
  purchaseLineProductId, purchaseLineQuantity, purchaseLineUnitCost,
} from './fields/commerce/purchase-fields';

const purchaseLineSchema = z.object({
  productId: purchaseLineProductId(),
  quantity: purchaseLineQuantity(),
  unitCost: purchaseLineUnitCost(),
});

export const createPurchaseSchema = z.object({
  warehouseId: purchaseWarehouseId(),
  supplierId: purchaseSupplierId(),
  currencyCode: purchaseCurrencyCode(),
  notes: purchaseNotes(),
  purchaseDate: purchaseDate(),
  lines: z.array(purchaseLineSchema).min(1, 'Debe tener al menos un producto'),
});

export const updatePurchaseSchema = createPurchaseSchema.partial();

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
