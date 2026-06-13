import { z } from 'zod';
import type { CachedCurrency } from '@/infrastructure/storage/db';

const nullableString = z.string().nullable().optional().default(null);

export const currencyResponseSchema: z.ZodSchema<CachedCurrency> = z.object({
  code: z.string(),
  name: z.string(),
  symbol: nullableString,
  isActive: z.boolean(),
  cachedAt: z.coerce.number().optional(),
});
