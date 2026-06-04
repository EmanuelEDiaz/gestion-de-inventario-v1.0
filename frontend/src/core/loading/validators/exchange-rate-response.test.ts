import { describe, it, expect } from 'vitest';
import { exchangeRateResponseSchema } from './exchange-rate-response';

const baseRate = {
  id: 'r-1',
  baseCode: 'USD',
  quoteCode: 'EUR',
  rate: 0.85,
  rateType: 'OFFICIAL',
  validFrom: '2026-06-04T00:00:00Z',
  createdBy: null,
  createdAt: '2026-06-04T00:00:00Z',
};

describe('exchangeRateResponseSchema', () => {
  it('passes a valid exchange rate', () => {
    const result = exchangeRateResponseSchema.safeParse(baseRate);
    expect(result.success).toBe(true);
  });

  it('fails when baseCode is missing', () => {
    const result = exchangeRateResponseSchema.safeParse({ ...baseRate, baseCode: undefined });
    expect(result.success).toBe(false);
  });

  it('coerces rate from string', () => {
    const result = exchangeRateResponseSchema.safeParse({ ...baseRate, rate: '0.92' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rate).toBe(0.92);
    }
  });

  it('accepts null for createdBy', () => {
    const result = exchangeRateResponseSchema.safeParse({ ...baseRate, createdBy: null });
    expect(result.success).toBe(true);
  });
});
