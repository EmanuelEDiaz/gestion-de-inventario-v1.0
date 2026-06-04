import { describe, it, expect } from 'vitest';
import { customerResponseSchema } from './customer-response';

const baseCustomer = {
  id: 'c-1',
  code: 'CUST-1',
  name: 'Test',
  contactName: null,
  phone: null,
  email: null,
  address: null,
  notes: null,
  active: true,
  province: null,
  municipality: null,
  street: null,
  locality: null,
  zipCode: null,
  latitude: null,
  longitude: null,
  createdAt: '2026-06-04T00:00:00Z',
  updatedAt: '2026-06-04T00:00:00Z',
};

describe('customerResponseSchema', () => {
  it('passes a valid customer', () => {
    const result = customerResponseSchema.safeParse(baseCustomer);
    expect(result.success).toBe(true);
  });

  it('fails when id is missing', () => {
    const result = customerResponseSchema.safeParse({ ...baseCustomer, id: undefined });
    expect(result.success).toBe(false);
  });

  it('fails when name is missing', () => {
    const result = customerResponseSchema.safeParse({ ...baseCustomer, name: undefined });
    expect(result.success).toBe(false);
  });

  it('fails when active is not a boolean', () => {
    const result = customerResponseSchema.safeParse({ ...baseCustomer, active: 'yes' });
    expect(result.success).toBe(false);
  });

  it('coerces numeric strings for latitude/longitude', () => {
    const result = customerResponseSchema.safeParse({
      ...baseCustomer,
      latitude: '19.4326',
      longitude: '-99.1332',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.latitude).toBe(19.4326);
    }
  });

  it('accepts null for all optional fields', () => {
    const result = customerResponseSchema.safeParse({
      ...baseCustomer,
      code: null,
      contactName: null,
      phone: null,
      email: null,
      address: null,
      notes: null,
      province: null,
      municipality: null,
      street: null,
      locality: null,
      zipCode: null,
      latitude: null,
      longitude: null,
    });
    expect(result.success).toBe(true);
  });
});
