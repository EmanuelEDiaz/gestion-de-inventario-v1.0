import type { Transfer, CreateTransferRequest, UpdateTransferRequest, TransferStatus } from '../entities/transfer';

/**
 * Puerto: Repositorio de Transferencias.
 * Define el contrato para acceso a datos (hexagonal: port).
 */
export interface ITransferRepository {
  findAll(): Promise<Transfer[]>;
  findById(id: string): Promise<Transfer>;
  findByFromWarehouse(warehouseId: string): Promise<Transfer[]>;
  findByToWarehouse(warehouseId: string): Promise<Transfer[]>;
  findByWarehouse(warehouseId: string): Promise<Transfer[]>;
  findByStatus(status: TransferStatus): Promise<Transfer[]>;
  create(data: CreateTransferRequest): Promise<Transfer>;
  update(id: string, data: UpdateTransferRequest): Promise<Transfer>;
  confirm(id: string): Promise<Transfer>;
  ship(id: string): Promise<Transfer>;
  complete(id: string, receivedDate?: string): Promise<Transfer>;
  cancel(id: string): Promise<Transfer>;
  delete(id: string): Promise<void>;
}
