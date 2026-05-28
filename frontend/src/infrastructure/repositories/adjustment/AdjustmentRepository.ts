import { apiClient } from '@/infrastructure/api/client';
import type { IAdjustmentRepository } from '@/core/adjustment/ports/IAdjustmentRepository';
import type { 
  Adjustment, 
  AdjustmentStatus, 
  CreateAdjustmentData, 
  UpdateAdjustmentData 
} from '@/core/adjustment/entities/adjustment';

/**
 * Adapter: Implementación HTTP del repositorio de ajustes.
 */
export class AdjustmentRepository implements IAdjustmentRepository {
  private readonly basePath = '/api/v1/adjustments';

  async findAll(): Promise<Adjustment[]> {
    const response = await apiClient.get<Adjustment[]>(this.basePath);
    return response.data;
  }

  async findById(id: string): Promise<Adjustment | null> {
    try {
      const response = await apiClient.get<Adjustment>(`${this.basePath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async findByWarehouse(warehouseId: string): Promise<Adjustment[]> {
    const response = await apiClient.get<Adjustment[]>(`${this.basePath}/warehouse/${warehouseId}`);
    return response.data;
  }

  async findByStatus(status: AdjustmentStatus): Promise<Adjustment[]> {
    const response = await apiClient.get<Adjustment[]>(`${this.basePath}/status/${status}`);
    return response.data;
  }

  async create(data: CreateAdjustmentData): Promise<Adjustment> {
    const response = await apiClient.post<Adjustment>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateAdjustmentData): Promise<Adjustment> {
    const response = await apiClient.put<Adjustment>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async confirm(id: string): Promise<Adjustment> {
    const response = await apiClient.post<Adjustment>(`${this.basePath}/${id}/confirm`);
    return response.data;
  }

  async cancel(id: string): Promise<Adjustment> {
    const response = await apiClient.post<Adjustment>(`${this.basePath}/${id}/cancel`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async deleteAll(ids: string[]): Promise<void> {
    await apiClient.delete(`${this.basePath}/batch`, { data: ids });
  }
}
