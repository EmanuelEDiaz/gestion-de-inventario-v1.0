import { describe, it, expect } from 'vitest';
import { currencyResponseSchema } from './currency-response';

const baseCurrency = {
  code: 'USD',
  name: 'US Dollar',
  symbol: '$',
  isActive: true,
};

describe('currencyResponseSchema', () => {
  it('passes a valid currency', () => {
    const result = currencyResponseSchema.safeParse(baseCurrency);
    expect(result.success).toBe(true);
  });

  it('fails when code is missing', () => {
    const result = currencyResponseSchema.safeParse({ ...baseCurrency, code: undefined });
    expect(result.success).toBe(false);
  });

  it('fails when isActive is not a boolean', () => {
    const result = currencyResponseSchema.safeParse({ ...baseCurrency, isActive: 'true' });
    expect(result.success).toBe(false);
  });

  it('accepts null for symbol', () => {
    const result = currencyResponseSchema.safeParse({ ...baseCurrency, symbol: null });
    expect(result.success).toBe(true);
  });
});
