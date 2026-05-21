import { InventoryMovement, MovementFilter } from '../entities/inventory-movement';

/**
 * Puerto: Repositorio de Movimientos
 */
export interface IMovementRepository {
  getById(id: string): Promise<InventoryMovement | null>;
  getAll(filter?: MovementFilter): Promise<InventoryMovement[]>;
  getByWarehouseAndProduct(warehouseId: string, productId: string): Promise<InventoryMovement[]>;
  getByDocument(docType: string, docId: string): Promise<InventoryMovement[]>;
  count(filter?: MovementFilter): Promise<number>;
}
