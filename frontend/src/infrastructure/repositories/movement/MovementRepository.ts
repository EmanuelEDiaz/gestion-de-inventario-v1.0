import { apiClient } from '@/infrastructure/api/client';
import { IMovementRepository } from '@/core/movement/ports/IMovementRepository';
import { InventoryMovement, MovementFilter } from '@/core/movement/entities/inventory-movement';
import { readWithCache } from '@/infrastructure/storage/networkAwareUtils';
import { getCachedMovements } from '@/infrastructure/storage/db';

export class MovementRepository implements IMovementRepository {
  private basePath = '/api/v1/movements';

  async getById(id: string): Promise<InventoryMovement | null> {
    return readWithCache(
      async () => {
        try {
          const response = await apiClient.get<InventoryMovement>(`${this.basePath}/${id}`);
          return response.data;
        } catch {
          return null;
        }
      },
      async () => {
        const movements = await getCachedMovements();
        const movement = movements.find(m => m.id === id);
        return movement as unknown as InventoryMovement ?? null;
      },
    );
  }

  async getAll(filter?: MovementFilter): Promise<InventoryMovement[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<InventoryMovement[]>(this.basePath, { params: filter });
        return response.data;
      },
      async () => getCachedMovements() as unknown as InventoryMovement[],
    );
  }

  async getByWarehouseAndProduct(warehouseId: string, productId: string): Promise<InventoryMovement[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<InventoryMovement[]>(`${this.basePath}/warehouse/${warehouseId}/product/${productId}`);
        return response.data;
      },
      async () => {
        const movements = await getCachedMovements();
        return movements.filter(m => m.warehouseId === warehouseId && m.productId === productId) as unknown as InventoryMovement[];
      },
    );
  }

  async getByDocument(docType: string, docId: string): Promise<InventoryMovement[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<InventoryMovement[]>(`${this.basePath}/document/${docType}/${docId}`);
        return response.data;
      },
      async () => {
        const movements = await getCachedMovements();
        return movements.filter(m => m.reference === `${docType}/${docId}`) as unknown as InventoryMovement[];
      },
    );
  }

  async count(filter?: MovementFilter): Promise<number> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<number>(`${this.basePath}/count`, { params: filter });
        return response.data;
      },
      async () => {
        const movements = await getCachedMovements();
        return movements.length;
      },
    );
  }
}

export const movementRepository = new MovementRepository();
