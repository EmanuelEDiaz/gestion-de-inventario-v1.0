import { z } from 'zod';
import { warehouseCode, warehouseName, warehouseAddress } from '../fields/core/warehouse-fields';

export const createWarehouseSchema = z.object({
  code: warehouseCode(),
  name: warehouseName(),
  address: warehouseAddress().optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
