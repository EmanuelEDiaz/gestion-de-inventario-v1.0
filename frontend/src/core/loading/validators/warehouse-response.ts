import { z } from 'zod';
import type { CachedWarehouse } from '@/infrastructure/storage/db';

const nullableString = z.string().nullable();

export const warehouseResponseSchema: z.ZodSchema<CachedWarehouse> = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  address: nullableString,
  active: z.boolean(),
  version: z.coerce.number().int().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  cachedAt: z.coerce.number().optional(),
});
