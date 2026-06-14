import { z } from 'zod';
import type { CachedStockBalance } from '@/infrastructure/storage/db';

const optionalString = z.string().optional();
const nullableString = z.string().nullable().optional().transform(v => v ?? undefined);
const optionalNullableNumber = z.coerce.number().nullable().optional();

export const stockResponseSchema: z.ZodSchema<CachedStockBalance> = z.object({
  id: z.string().optional(),
  warehouseId: z.string(),
  productId: z.string(),
  warehouseName: nullableString,
  productName: nullableString,
  productSku: nullableString,
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
