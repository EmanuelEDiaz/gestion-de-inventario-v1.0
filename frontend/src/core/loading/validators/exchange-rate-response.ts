import { z } from 'zod';
import type { CachedExchangeRate } from '@/infrastructure/storage/db';

const nullableString = z.string().nullable().optional().default(null);

export const exchangeRateResponseSchema: z.ZodSchema<CachedExchangeRate> = z.object({
  id: z.string(),
  baseCode: z.string(),
  quoteCode: z.string(),
  rate: z.coerce.number(),
  rateType: z.string(),
  validFrom: z.string(),
  createdBy: nullableString,
  createdAt: z.string(),
  cachedAt: z.coerce.number().optional(),
});
