/**
 * ToggleWarehouseStatusUseCase - Activates or deactivates a warehouse
 */

import type { IWarehouseRepository } from '../ports/IWarehouseRepository';
import type { Warehouse } from '../entities/warehouse';
import { WarehouseValidationError, WarehouseNotFoundError } from '../../errors/WarehouseErrors';

export class ToggleWarehouseStatusUseCase {
  constructor(private readonly warehouseRepo: IWarehouseRepository) {}

  async execute(id: string, activate: boolean): Promise<Warehouse> {
    if (!id) throw new WarehouseValidationError('ID del almacén es requerido');
    try {
      return activate
        ? await this.warehouseRepo.activate(id)
        : await this.warehouseRepo.deactivate(id);
    } catch (e) {
      if (e instanceof WarehouseNotFoundError) throw e;
      throw new WarehouseNotFoundError(id);
    }
  }
}
