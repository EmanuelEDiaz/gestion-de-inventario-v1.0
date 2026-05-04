import { IMovementRepository } from '../../interfaces/IMovementRepository';
import { InventoryMovement, MovementFilter } from '../../entities/inventory-movement';

export class GetMovementByIdUseCase {
  constructor(private repository: IMovementRepository) {}

  async execute(id: string): Promise<InventoryMovement | null> {
    return this.repository.getById(id);
  }
}

export class GetAllMovementsUseCase {
  constructor(private repository: IMovementRepository) {}

  async execute(filter?: MovementFilter): Promise<InventoryMovement[]> {
    return this.repository.getAll(filter);
  }
}

export class GetMovementsByWarehouseProductUseCase {
  constructor(private repository: IMovementRepository) {}

  async execute(warehouseId: string, productId: string): Promise<InventoryMovement[]> {
    return this.repository.getByWarehouseAndProduct(warehouseId, productId);
  }
}

export class GetMovementsByDocumentUseCase {
  constructor(private repository: IMovementRepository) {}

  async execute(docType: string, docId: string): Promise<InventoryMovement[]> {
    return this.repository.getByDocument(docType, docId);
  }
}

export class CountMovementsUseCase {
  constructor(private repository: IMovementRepository) {}

  async execute(filter?: MovementFilter): Promise<number> {
    return this.repository.count(filter);
  }
}
