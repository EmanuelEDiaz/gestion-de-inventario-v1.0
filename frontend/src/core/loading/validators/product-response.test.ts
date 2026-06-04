import { describe, it, expect } from 'vitest';
import { productResponseSchema } from './product-response';

const baseProduct = {
  id: 'p-1',
  sku: 'SKU-1',
  barcode: null,
  name: 'Test',
  description: null,
  categoryId: null,
  categoryName: null,
  status: 'ACTIVE' as const,
  costMethod: 'STANDARD' as const,
  standardCost: 10,
  salePrice: 20,
  reorderPoint: 5,
  currencyCode: 'USD',
  taxRate: 0.1,
  unitOfMeasure: 'UNIT' as const,
  createdAt: '2026-06-04T00:00:00Z',
  updatedAt: '2026-06-04T00:00:00Z',
  version: 1,
  mainImage: null,
};

describe('productResponseSchema', () => {
  it('passes a valid product', () => {
    const result = productResponseSchema.safeParse(baseProduct);
    expect(result.success).toBe(true);
  });

  it('coerces numeric strings (BigDecimal defensive parsing)', () => {
    const result = productResponseSchema.safeParse({ ...baseProduct, salePrice: '19.99' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.salePrice).toBe(19.99);
    }
  });

  it('fails when id is missing', () => {
    const result = productResponseSchema.safeParse({ ...baseProduct, id: undefined });
    expect(result.success).toBe(false);
  });

  it('fails when name is missing', () => {
    const result = productResponseSchema.safeParse({ ...baseProduct, name: undefined });
    expect(result.success).toBe(false);
  });

  it('fails when status is not a valid enum value', () => {
    const result = productResponseSchema.safeParse({ ...baseProduct, status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('accepts null for nullable fields', () => {
    const result = productResponseSchema.safeParse({
      ...baseProduct,
      sku: null,
      barcode: null,
      description: null,
      categoryId: null,
      categoryName: null,
      standardCost: null,
      salePrice: null,
      reorderPoint: null,
      mainImage: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional cachedAt and version', () => {
    const result = productResponseSchema.safeParse({ ...baseProduct, cachedAt: 12345, version: 7 });
    expect(result.success).toBe(true);
  });
});
