import { describe, it, expect } from 'vitest';
import { supplierResponseSchema } from './supplier-response';

const baseSupplier = {
  id: 's-1',
  code: 'SUPP-1',
  name: 'Test Supplier',
  contactName: null,
  phone: null,
  email: null,
  address: null,
  notes: null,
  active: true,
  website: null,
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

describe('supplierResponseSchema', () => {
  it('passes a valid supplier', () => {
    const result = supplierResponseSchema.safeParse(baseSupplier);
    expect(result.success).toBe(true);
  });

  it('fails when name is missing', () => {
    const result = supplierResponseSchema.safeParse({ ...baseSupplier, name: undefined });
    expect(result.success).toBe(false);
  });

  it('accepts website as a URL string', () => {
    const result = supplierResponseSchema.safeParse({ ...baseSupplier, website: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts null for all optional fields', () => {
    const result = supplierResponseSchema.safeParse({
      ...baseSupplier,
      code: null,
      contactName: null,
      phone: null,
      email: null,
      address: null,
      notes: null,
      website: null,
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
