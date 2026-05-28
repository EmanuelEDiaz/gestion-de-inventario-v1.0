import type { Adjustment, CreateAdjustmentData, UpdateAdjustmentData, AdjustmentStatus } from '@/core/adjustment/entities/adjustment';

/**
 * Port: Contrato para acceso a datos de ajustes.
 */
export interface IAdjustmentRepository {
  findAll(): Promise<Adjustment[]>;
  findById(id: string): Promise<Adjustment | null>;
  findByWarehouse(warehouseId: string): Promise<Adjustment[]>;
  findByStatus(status: AdjustmentStatus): Promise<Adjustment[]>;
  create(data: CreateAdjustmentData): Promise<Adjustment>;
  update(id: string, data: UpdateAdjustmentData): Promise<Adjustment>;
  confirm(id: string): Promise<Adjustment>;
  cancel(id: string): Promise<Adjustment>;
  delete(id: string): Promise<void>;
  deleteAll(ids: string[]): Promise<void>;
}
