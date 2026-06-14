import { z } from 'zod';
import { currencyCode, currencyName, currencySymbol } from './fields/core/currency-fields';

export const createCurrencySchema = z.object({
  code: currencyCode(),
  name: currencyName(),
  symbol: currencySymbol().optional(),
});

export const updateCurrencySchema = createCurrencySchema.partial();

export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;
export type UpdateCurrencyInput = z.infer<typeof updateCurrencySchema>;
