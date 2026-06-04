import { describe, it, expect } from 'vitest';
import { stockResponseSchema } from './stock-response';

const baseStock = {
  id: 'st-1',
  warehouseId: 'w-1',
  productId: 'p-1',
  onHand: 42,
};

describe('stockResponseSchema', () => {
  it('passes a valid stock balance', () => {
    const result = stockResponseSchema.safeParse(baseStock);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.onHand).toBe(42);
    }
  });

  it('coerces onHand from string', () => {
    const result = stockResponseSchema.safeParse({ ...baseStock, onHand: '100' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.onHand).toBe(100);
    }
  });

  it('fails when warehouseId is missing', () => {
    const result = stockResponseSchema.safeParse({ ...baseStock, warehouseId: undefined });
    expect(result.success).toBe(false);
  });

  it('fails when onHand is missing', () => {
    const { onHand: _onHand, ...without } = baseStock;
    void _onHand;
    const result = stockResponseSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it('accepts optional warehouseName/productName/productSku', () => {
    const result = stockResponseSchema.safeParse({
      ...baseStock,
      warehouseName: 'Main',
      productName: 'Test Product',
      productSku: 'SKU-1',
    });
    expect(result.success).toBe(true);
  });
});
