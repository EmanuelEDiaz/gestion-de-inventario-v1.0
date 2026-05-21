import type { Transfer, CreateTransferRequest, UpdateTransferRequest } from '../entities/transfer';
import type { ITransferRepository } from '../ports/ITransferRepository';

/**
 * Use Case: Crear transferencia.
 */
export class CreateTransferUseCase {
  constructor(private repo: ITransferRepository) {}
  
  execute(data: CreateTransferRequest): Promise<Transfer> {
    return this.repo.create(data);
  }
}

/**
 * Use Case: Actualizar transferencia.
 */
export class UpdateTransferUseCase {
  constructor(private repo: ITransferRepository) {}
  
  execute(id: string, data: UpdateTransferRequest): Promise<Transfer> {
    return this.repo.update(id, data);
  }
}

/**
 * Use Case: Confirmar transferencia.
 */
export class ConfirmTransferUseCase {
  constructor(private repo: ITransferRepository) {}
  
  execute(id: string): Promise<Transfer> {
    return this.repo.confirm(id);
  }
}

/**
 * Use Case: Enviar transferencia (ship).
 */
export class ShipTransferUseCase {
  constructor(private repo: ITransferRepository) {}
  
  execute(id: string): Promise<Transfer> {
    return this.repo.ship(id);
  }
}

/**
 * Use Case: Completar transferencia.
 */
export class CompleteTransferUseCase {
  constructor(private repo: ITransferRepository) {}
  
  execute(id: string, receivedDate?: string): Promise<Transfer> {
    return this.repo.complete(id, receivedDate);
  }
}

/**
 * Use Case: Cancelar transferencia.
 */
export class CancelTransferUseCase {
  constructor(private repo: ITransferRepository) {}
  
  execute(id: string): Promise<Transfer> {
    return this.repo.cancel(id);
  }
}

/**
 * Use Case: Eliminar transferencia.
 */
export class DeleteTransferUseCase {
  constructor(private repo: ITransferRepository) {}
  
  execute(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
