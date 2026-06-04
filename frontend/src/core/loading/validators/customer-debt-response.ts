import { z } from 'zod';
import type { CachedCustomerDebt } from '@/infrastructure/storage/db';

const nullableString = z.string().nullable();

export const customerDebtResponseSchema: z.ZodSchema<CachedCustomerDebt> = z.object({
  id: z.string(),
  customerId: z.string(),
  saleId: z.string(),
  originalAmount: z.coerce.number(),
  paidAmount: z.coerce.number(),
  pendingAmount: z.coerce.number(),
  currencyCode: z.string(),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'CANCELLED']),
  description: nullableString,
  dueDate: nullableString,
  notes: nullableString,
  createdAt: z.string(),
  updatedAt: z.string(),
  cachedAt: z.coerce.number().optional(),
});
