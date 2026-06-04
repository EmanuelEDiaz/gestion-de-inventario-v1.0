import { describe, it, expect } from 'vitest';
import { warehouseResponseSchema } from './warehouse-response';

const baseWarehouse = {
  id: 'w-1',
  code: 'WH-1',
  name: 'Main Warehouse',
  address: null,
  active: true,
  version: 1,
  createdAt: '2026-06-04T00:00:00Z',
  updatedAt: '2026-06-04T00:00:00Z',
};

describe('warehouseResponseSchema', () => {
  it('passes a valid warehouse', () => {
    const result = warehouseResponseSchema.safeParse(baseWarehouse);
    expect(result.success).toBe(true);
  });

  it('fails when code is missing', () => {
    const result = warehouseResponseSchema.safeParse({ ...baseWarehouse, code: undefined });
    expect(result.success).toBe(false);
  });

  it('fails when active is not a boolean', () => {
    const result = warehouseResponseSchema.safeParse({ ...baseWarehouse, active: 1 });
    expect(result.success).toBe(false);
  });

  it('accepts null for address', () => {
    const result = warehouseResponseSchema.safeParse({ ...baseWarehouse, address: null });
    expect(result.success).toBe(true);
  });

  it('accepts missing version (optional)', () => {
    const { version: _version, ...withoutVersion } = baseWarehouse;
    void _version;
    const result = warehouseResponseSchema.safeParse(withoutVersion);
    expect(result.success).toBe(true);
  });
});
