import type { Adjustment, AdjustmentStatus } from '@/core/adjustment/entities/adjustment';
import type { IAdjustmentRepository } from '@/core/adjustment/ports/IAdjustmentRepository';

/**
 * Use Case: Obtener ajustes.
 */
export class GetAdjustmentsUseCase {
  constructor(private repository: IAdjustmentRepository) {}

  async execute(): Promise<Adjustment[]> {
    return this.repository.findAll();
  }
}

export class GetAdjustmentByIdUseCase {
  constructor(private repository: IAdjustmentRepository) {}

  async execute(id: string): Promise<Adjustment | null> {
    return this.repository.findById(id);
  }
}

export class GetAdjustmentsByWarehouseUseCase {
  constructor(private repository: IAdjustmentRepository) {}

  async execute(warehouseId: string): Promise<Adjustment[]> {
    return this.repository.findByWarehouse(warehouseId);
  }
}

export class GetAdjustmentsByStatusUseCase {
  constructor(private repository: IAdjustmentRepository) {}

  async execute(status: AdjustmentStatus): Promise<Adjustment[]> {
    return this.repository.findByStatus(status);
  }
}
