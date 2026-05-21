/**
 * CreateWarehouseUseCase - Creates a new warehouse
 */

import type { IWarehouseRepository } from '../ports/IWarehouseRepository';
import type { Warehouse, CreateWarehouseData } from '../entities/warehouse';
import { WarehouseValidationError } from '../../errors/WarehouseErrors';

export class CreateWarehouseUseCase {
  constructor(private readonly warehouseRepo: IWarehouseRepository) {}

  async execute(data: CreateWarehouseData): Promise<Warehouse> {
    if (!data.code?.trim()) throw new WarehouseValidationError('El código del almacén es requerido');
    if (!data.name?.trim()) throw new WarehouseValidationError('El nombre del almacén es requerido');
    return this.warehouseRepo.create({ ...data, code: data.code.toUpperCase() });
  }
}
