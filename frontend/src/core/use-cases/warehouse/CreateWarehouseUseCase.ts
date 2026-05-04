/**
 * CreateWarehouseUseCase - Creates a new warehouse
 */

import type { IWarehouseRepository } from '../../interfaces/IWarehouseRepository';
import type { Warehouse, CreateWarehouseData } from '../../entities/warehouse';

export class CreateWarehouseUseCase {
  constructor(private readonly warehouseRepo: IWarehouseRepository) {}

  async execute(data: CreateWarehouseData): Promise<Warehouse> {
    if (!data.code?.trim()) throw new Error('El código del almacén es requerido');
    if (!data.name?.trim()) throw new Error('El nombre del almacén es requerido');
    return this.warehouseRepo.create({ ...data, code: data.code.toUpperCase() });
  }
}
