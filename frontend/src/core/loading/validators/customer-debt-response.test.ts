import { describe, it, expect } from 'vitest';
import { customerDebtResponseSchema } from './customer-debt-response';

const baseDebt = {
  id: 'd-1',
  customerId: 'c-1',
  saleId: 's-1',
  originalAmount: 100,
  paidAmount: 30,
  pendingAmount: 70,
  currencyCode: 'USD',
  status: 'PARTIAL' as const,
  description: null,
  dueDate: null,
  notes: null,
  createdAt: '2026-06-04T00:00:00Z',
  updatedAt: '2026-06-04T00:00:00Z',
};

describe('customerDebtResponseSchema', () => {
  it('passes a valid customer debt', () => {
    const result = customerDebtResponseSchema.safeParse(baseDebt);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.originalAmount).toBe(100);
      expect(result.data.paidAmount).toBe(30);
      expect(result.data.pendingAmount).toBe(70);
    }
  });

  it('fails when originalAmount is missing', () => {
    const result = customerDebtResponseSchema.safeParse({ ...baseDebt, originalAmount: undefined });
    expect(result.success).toBe(false);
  });

  it('fails when status is not a valid enum value', () => {
    const result = customerDebtResponseSchema.safeParse({ ...baseDebt, status: 'OVERDUE' });
    expect(result.success).toBe(false);
  });

  it('coerces amounts from strings (BigDecimal defensive)', () => {
    const result = customerDebtResponseSchema.safeParse({
      ...baseDebt,
      originalAmount: '150.50',
      paidAmount: '50',
      pendingAmount: '100.50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.originalAmount).toBe(150.5);
    }
  });

  it('accepts null description, dueDate, notes', () => {
    const result = customerDebtResponseSchema.safeParse({
      ...baseDebt,
      description: null,
      dueDate: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});
