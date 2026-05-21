/**
 * GetWarehousesUseCase - Retrieves all warehouses
 */

import type { IWarehouseRepository } from '../ports/IWarehouseRepository';
import type { Warehouse } from '../entities/warehouse';

export class GetWarehousesUseCase {
  constructor(private readonly warehouseRepo: IWarehouseRepository) {}

  async execute(activeOnly = true): Promise<Warehouse[]> {
    return this.warehouseRepo.getAll(activeOnly);
  }
}
