import { z } from 'zod';
import type { CachedStockBalance } from '@/infrastructure/storage/db';

const optionalString = z.string().optional();
const optionalNullableNumber = z.coerce.number().nullable().optional();

export const stockResponseSchema: z.ZodSchema<CachedStockBalance> = z.object({
  id: z.string().optional(),
  warehouseId: z.string(),
  productId: z.string(),
  warehouseName: optionalString,
  productName: optionalString,
  productSku: optionalString,
  onHand: z.coerce.number(),
  reserved: z.coerce.number().optional(),
  available: z.coerce.number().optional(),
  avgCost: optionalNullableNumber,
  totalValue: optionalNullableNumber,
  updatedAt: optionalString,
  cachedAt: z.coerce.number().optional(),
}).transform(data => ({
  ...data,
  id: data.id ?? `${data.warehouseId}:${data.productId}`,
}));
