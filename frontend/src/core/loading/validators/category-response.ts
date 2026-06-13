import { z } from 'zod';
import type { CachedCategory } from '@/infrastructure/storage/db';

const nullableString = z.string().nullable().optional().default(null);

export const categoryResponseSchema: z.ZodSchema<CachedCategory> = z.object({
  id: z.string(),
  parentId: nullableString,
  name: z.string(),
  path: z.string(),
  level: z.coerce.number().int(),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  cachedAt: z.coerce.number().optional(),
});
