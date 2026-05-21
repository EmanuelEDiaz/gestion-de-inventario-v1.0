import type { Adjustment, CreateAdjustmentData, UpdateAdjustmentData } from '@/core/adjustment/entities/adjustment';
import type { IAdjustmentRepository } from '@/core/adjustment/ports/IAdjustmentRepository';

/**
 * Use Case: Crear ajuste.
 */
export class CreateAdjustmentUseCase {
  constructor(private repository: IAdjustmentRepository) {}

  async execute(data: CreateAdjustmentData): Promise<Adjustment> {
    return this.repository.create(data);
  }
}

export class UpdateAdjustmentUseCase {
  constructor(private repository: IAdjustmentRepository) {}

  async execute(id: string, data: UpdateAdjustmentData): Promise<Adjustment> {
    return this.repository.update(id, data);
  }
}

export class ConfirmAdjustmentUseCase {
  constructor(private repository: IAdjustmentRepository) {}

  async execute(id: string): Promise<Adjustment> {
    return this.repository.confirm(id);
  }
}

export class CancelAdjustmentUseCase {
  constructor(private repository: IAdjustmentRepository) {}

  async execute(id: string): Promise<Adjustment> {
    return this.repository.cancel(id);
  }
}

export class DeleteAdjustmentUseCase {
  constructor(private repository: IAdjustmentRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
