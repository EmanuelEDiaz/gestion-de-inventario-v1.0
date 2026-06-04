import { describe, it, expect } from 'vitest';
import { categoryResponseSchema } from './category-response';

const baseCategory = {
  id: 'cat-1',
  parentId: null,
  name: 'Test Category',
  path: '/test',
  level: 0,
  sortOrder: 1,
  active: true,
  createdAt: '2026-06-04T00:00:00Z',
  updatedAt: '2026-06-04T00:00:00Z',
};

describe('categoryResponseSchema', () => {
  it('passes a valid category', () => {
    const result = categoryResponseSchema.safeParse(baseCategory);
    expect(result.success).toBe(true);
  });

  it('fails when name is missing', () => {
    const result = categoryResponseSchema.safeParse({ ...baseCategory, name: undefined });
    expect(result.success).toBe(false);
  });

  it('fails when level is not coercible to a number', () => {
    const result = categoryResponseSchema.safeParse({ ...baseCategory, level: 'abc' });
    expect(result.success).toBe(false);
  });

  it('coerces string level/sortOrder to numbers', () => {
    const result = categoryResponseSchema.safeParse({ ...baseCategory, level: '2', sortOrder: '5' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level).toBe(2);
      expect(result.data.sortOrder).toBe(5);
    }
  });

  it('accepts null parentId for root categories', () => {
    const result = categoryResponseSchema.safeParse({ ...baseCategory, parentId: null });
    expect(result.success).toBe(true);
  });
});
