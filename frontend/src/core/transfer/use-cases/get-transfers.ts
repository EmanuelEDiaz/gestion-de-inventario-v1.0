import type { Transfer } from '../entities/transfer';
import type { ITransferRepository } from '../ports/ITransferRepository';

/**
 * Use Case: Obtener todas las transferencias.
 * (clean-code: SRP - solo lectura)
 */
export class GetTransfersUseCase {
  constructor(private repo: ITransferRepository) {}
  
  execute(): Promise<Transfer[]> {
    return this.repo.findAll();
  }
}

/**
 * Use Case: Obtener transferencia por ID.
 */
export class GetTransferByIdUseCase {
  constructor(private repo: ITransferRepository) {}
  
  execute(id: string): Promise<Transfer> {
    return this.repo.findById(id);
  }
}

/**
 * Use Case: Obtener transferencias por almacén.
 */
export class GetTransfersByWarehouseUseCase {
  constructor(private repo: ITransferRepository) {}
  
  execute(warehouseId: string): Promise<Transfer[]> {
    return this.repo.findByWarehouse(warehouseId);
  }
}
