import { z } from 'zod';
import type { CachedWarehouse } from '@/infrastructure/storage/db';
import { warehouseCode, warehouseName, warehouseAddress } from '@/core/validators/fields/core/warehouse-fields';

const nullableString = warehouseAddress().nullable().optional().default(null);

export const warehouseResponseSchema: z.ZodSchema<CachedWarehouse> = z.object({
  id: z.string(),
  code: warehouseCode(),
  name: warehouseName(),
  address: nullableString,
  active: z.boolean(),
  version: z.coerce.number().int().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  cachedAt: z.coerce.number().optional(),
});
