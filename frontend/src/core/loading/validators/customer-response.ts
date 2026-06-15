import { z } from 'zod';
import type { CachedCustomer } from '@/infrastructure/storage/db';

const nullableString = z.string().nullable().optional().default(null);
const nullableNumber = z.coerce.number().nullable().catch(null);

export const customerResponseSchema: z.ZodSchema<CachedCustomer> = z.object({
  id: z.string(),
  code: nullableString,
  name: z.string(),
  contactName: nullableString,
  phone: nullableString,
  email: nullableString,
  address: nullableString,
  notes: nullableString,
  active: z.boolean(),
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
  nameLower: z.string().optional(),
});
