/**
 * IWarehouseRepository - Port for warehouse data access
 */

import type { Warehouse, CreateWarehouseData, UpdateWarehouseData } from '../entities/warehouse';

export interface IWarehouseRepository {
  getAll(activeOnly?: boolean): Promise<Warehouse[]>;
  getById(id: string): Promise<Warehouse>;
  create(data: CreateWarehouseData): Promise<Warehouse>;
  update(id: string, data: UpdateWarehouseData): Promise<Warehouse>;
  activate(id: string): Promise<Warehouse>;
  deactivate(id: string): Promise<Warehouse>;
}
