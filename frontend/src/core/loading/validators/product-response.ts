import { z } from 'zod';
import type { CachedProduct } from '@/infrastructure/storage/db';

const nullableString = z.string().nullable();
const nullableNumber = z.coerce.number().nullable();
const optionalString = z.string().optional();

export const productResponseSchema: z.ZodSchema<CachedProduct> = z.object({
  id: z.string(),
  sku: nullableString,
  barcode: nullableString,
  name: z.string(),
  description: nullableString,
  categoryId: nullableString,
  categoryName: nullableString,
  status: z.enum(['ACTIVE', 'ARCHIVED']),
  costMethod: z.enum(['INHERIT', 'STANDARD', 'WAC', 'FIFO']),
  standardCost: nullableNumber,
  salePrice: nullableNumber,
  reorderPoint: nullableNumber,
  currencyCode: optionalString,
  taxRate: z.coerce.number().default(0),
  unitOfMeasure: z.enum(['UNIT', 'KG', 'L', 'M', 'M2', 'BOX', 'PACK']),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.coerce.number().int().optional(),
  mainImage: nullableString,
  cachedAt: z.coerce.number().optional(),
});
