/**
 * ToggleWarehouseStatusUseCase - Activates or deactivates a warehouse
 */

import type { IWarehouseRepository } from '../../interfaces/IWarehouseRepository';
import type { Warehouse } from '../../entities/warehouse';

export class ToggleWarehouseStatusUseCase {
  constructor(private readonly warehouseRepo: IWarehouseRepository) {}

  async execute(id: string, activate: boolean): Promise<Warehouse> {
    if (!id) throw new Error('ID del almacén es requerido');
    return activate 
      ? this.warehouseRepo.activate(id) 
      : this.warehouseRepo.deactivate(id);
  }
}
