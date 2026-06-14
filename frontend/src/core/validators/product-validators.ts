import { z } from 'zod';
import {
  productName,
  productSku,
  productBarcode,
  productDescription,
  productStandardCost,
  productSalePrice,
  productTaxRate,
  productReorderPoint,
  unitOfMeasure,
  productStatus,
  costMethod,
} from './fields/core/product-fields';

export const createProductSchema = z.object({
  name: productName(),
  sku: productSku().nullable().optional(),
  barcode: productBarcode().nullable().optional(),
  description: productDescription().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  standardCost: productStandardCost().nullable().optional(),
  salePrice: productSalePrice().nullable().optional(),
  taxRate: productTaxRate().optional(),
  reorderPoint: productReorderPoint().nullable().optional(),
  unitOfMeasure: unitOfMeasure.optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  status: productStatus.optional(),
  costMethod: costMethod.optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
