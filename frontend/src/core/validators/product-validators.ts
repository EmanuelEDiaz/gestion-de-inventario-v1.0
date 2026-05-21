import { z } from 'zod';

const unitOfMeasure = z.enum(['UNIT', 'KG', 'L', 'M', 'M2', 'BOX', 'PACK']);
const productStatus = z.enum(['ACTIVE', 'ARCHIVED']);
const costMethod = z.enum(['INHERIT', 'STANDARD', 'WAC', 'FIFO']);

export const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  standardCost: z.number().min(0, 'Debe ser mayor o igual a 0').nullable().optional(),
  salePrice: z.number().min(0, 'Debe ser mayor o igual a 0').nullable().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  reorderPoint: z.number().min(0).nullable().optional(),
  unitOfMeasure: unitOfMeasure.optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  status: productStatus.optional(),
  costMethod: costMethod.optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
