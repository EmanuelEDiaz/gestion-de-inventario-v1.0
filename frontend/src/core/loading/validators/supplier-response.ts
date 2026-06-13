import { z } from 'zod';
import type { CachedSupplier } from '@/infrastructure/storage/db';

const nullableString = z.string().nullable().optional().default(null);
const nullableNumber = z.coerce.number().nullable();

export const supplierResponseSchema: z.ZodSchema<CachedSupplier> = z.object({
  id: z.string(),
  code: nullableString,
  name: z.string(),
  contactName: nullableString,
  phone: nullableString,
  email: nullableString,
  address: nullableString,
  notes: nullableString,
  active: z.boolean(),
  website: nullableString,
  province: nullableString,
  municipality: nullableString,
  street: nullableString,
  locality: nullableString,
  zipCode: nullableString,
  latitude: nullableNumber,
  longitude: nullableNumber,
  createdAt: z.string(),
  updatedAt: z.string(),
  cachedAt: z.coerce.number().optional(),
});
