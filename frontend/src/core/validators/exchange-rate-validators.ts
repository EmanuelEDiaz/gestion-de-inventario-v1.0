import { z } from 'zod';
import { exchangeRateValue, rateType } from './fields/core/exchange-rate-fields';

export const createExchangeRateSchema = z.object({
  baseCode: z.string().min(1, 'La moneda base es requerida'),
  quoteCode: z.string().min(1, 'La moneda cotizada es requerida'),
  rate: exchangeRateValue(),
  rateType: rateType.optional(),
  validFrom: z.string().optional(),
});

export const updateExchangeRateSchema = createExchangeRateSchema.partial();

export type CreateExchangeRateInput = z.infer<typeof createExchangeRateSchema>;
export type UpdateExchangeRateInput = z.infer<typeof updateExchangeRateSchema>;
