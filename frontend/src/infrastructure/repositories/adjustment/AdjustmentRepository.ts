import { apiClient } from '@/infrastructure/api/client';
import type { IAdjustmentRepository } from '@/core/adjustment/ports/IAdjustmentRepository';
import type { 
  Adjustment, 
  AdjustmentStatus, 
  CreateAdjustmentData, 
  UpdateAdjustmentData 
} from '@/core/adjustment/entities/adjustment';
import { readWithCache, isOnline } from '@/infrastructure/storage/networkAwareUtils';
import { getCachedAdjustments } from '@/infrastructure/storage/db';

/**
 * Adapter: Implementación HTTP del repositorio de ajustes.
 */
export class AdjustmentRepository implements IAdjustmentRepository {
  private readonly basePath = '/api/v1/adjustments';

  async findAll(): Promise<Adjustment[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Adjustment[]>(this.basePath);
        return response.data;
      },
      async () => getCachedAdjustments() as unknown as Adjustment[],
    );
  }

  async findById(id: string): Promise<Adjustment | null> {
    return readWithCache(
      async () => {
        try {
          const response = await apiClient.get<Adjustment>(`${this.basePath}/${id}`);
          return response.data;
        } catch {
          return null;
        }
      },
      async () => {
        const adjustments = await getCachedAdjustments();
        const adjustment = adjustments.find(a => a.id === id);
        return adjustment as unknown as Adjustment ?? null;
      },
    );
  }

  async findByWarehouse(warehouseId: string): Promise<Adjustment[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Adjustment[]>(`${this.basePath}/warehouse/${warehouseId}`);
        return response.data;
      },
      async () => {
        const adjustments = await getCachedAdjustments();
        return adjustments.filter(a => a.warehouseId === warehouseId) as unknown as Adjustment[];
      },
    );
  }

  async findByStatus(status: AdjustmentStatus): Promise<Adjustment[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Adjustment[]>(`${this.basePath}/status/${status}`);
        return response.data;
      },
      async () => {
        const adjustments = await getCachedAdjustments();
        return adjustments.filter(a => a.type === status) as unknown as Adjustment[];
      },
    );
  }

  async create(data: CreateAdjustmentData): Promise<Adjustment> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para crear ajustes');
    }
    const response = await apiClient.post<Adjustment>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateAdjustmentData): Promise<Adjustment> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para actualizar ajustes');
    }
    const response = await apiClient.put<Adjustment>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async confirm(id: string): Promise<Adjustment> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para confirmar ajustes');
    }
    const response = await apiClient.post<Adjustment>(`${this.basePath}/${id}/confirm`);
    return response.data;
  }

  async cancel(id: string): Promise<Adjustment> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para cancelar ajustes');
    }
    const response = await apiClient.post<Adjustment>(`${this.basePath}/${id}/cancel`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para eliminar ajustes');
    }
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async deleteAll(ids: string[]): Promise<void> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para eliminar ajustes');
    }
    await apiClient.delete(`${this.basePath}/batch`, { data: ids });
  }
}
