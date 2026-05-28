import type { Return, CreateReturnData, UpdateReturnData, ReturnType, ReturnStatus } from '@/core/return/entities/return';

/**
 * Port: Contrato para acceso a datos de devoluciones.
 */
export interface IReturnRepository {
  findAll(): Promise<Return[]>;
  findById(id: string): Promise<Return | null>;
  findByWarehouse(warehouseId: string): Promise<Return[]>;
  findByType(type: ReturnType): Promise<Return[]>;
  findByStatus(status: ReturnStatus): Promise<Return[]>;
  create(data: CreateReturnData): Promise<Return>;
  update(id: string, data: UpdateReturnData): Promise<Return>;
  confirm(id: string): Promise<Return>;
  cancel(id: string): Promise<Return>;
  delete(id: string): Promise<void>;
  deleteAll(ids: string[]): Promise<void>;
}
