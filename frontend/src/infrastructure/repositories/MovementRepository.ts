import { apiClient } from '@/presentation/shared/lib/api-client';
import { IMovementRepository } from '@/core/interfaces/IMovementRepository';
import { InventoryMovement, MovementFilter } from '@/core/entities/inventory-movement';

export class MovementRepository implements IMovementRepository {
  private basePath = '/api/v1/movements';

  async getById(id: string): Promise<InventoryMovement | null> {
    try {
      const response = await apiClient.get<InventoryMovement>(`${this.basePath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getAll(filter?: MovementFilter): Promise<InventoryMovement[]> {
    const response = await apiClient.get<InventoryMovement[]>(this.basePath, {
      params: filter
    });
    return response.data;
  }

  async getByWarehouseAndProduct(warehouseId: string, productId: string): Promise<InventoryMovement[]> {
    const response = await apiClient.get<InventoryMovement[]>(
      `${this.basePath}/warehouse/${warehouseId}/product/${productId}`
    );
    return response.data;
  }

  async getByDocument(docType: string, docId: string): Promise<InventoryMovement[]> {
    const response = await apiClient.get<InventoryMovement[]>(
      `${this.basePath}/document/${docType}/${docId}`
    );
    return response.data;
  }

  async count(filter?: MovementFilter): Promise<number> {
    const response = await apiClient.get<number>(`${this.basePath}/count`, {
      params: filter
    });
    return response.data;
  }
}

export const movementRepository = new MovementRepository();
