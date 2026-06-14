import { z } from 'zod';
import {
  saleWarehouseId, saleCustomerId, saleCurrencyCode,
  saleNotes, saleDate, salePaymentMode,
  saleLineProductId, saleLineQuantity, saleLineUnitPrice, saleLineDiscount,
} from './fields/commerce/sale-fields';

const saleLineSchema = z.object({
  productId: saleLineProductId(),
  quantity: saleLineQuantity(),
  unitPrice: saleLineUnitPrice(),
  discount: saleLineDiscount(),
});

export const createSaleSchema = z.object({
  warehouseId: saleWarehouseId(),
  customerId: saleCustomerId(),
  currencyCode: saleCurrencyCode(),
  notes: saleNotes(),
  saleDate: saleDate(),
  paymentMode: salePaymentMode.optional(),
  lines: z.array(saleLineSchema).min(1, 'Debe tener al menos un producto'),
});

export const updateSaleSchema = createSaleSchema.partial();

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
