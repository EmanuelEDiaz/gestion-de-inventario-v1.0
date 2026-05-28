import { apiClient } from '@/infrastructure/api/client';
import type { IReturnRepository } from '@/core/return/ports/IReturnRepository';
import type { Return, ReturnType, ReturnStatus, CreateReturnData, UpdateReturnData } from '@/core/return/entities/return';

/**
 * Adapter: Implementación HTTP del repositorio de devoluciones.
 */
export class ReturnRepository implements IReturnRepository {
  private readonly basePath = '/api/v1/returns';

  async findAll(): Promise<Return[]> {
    const response = await apiClient.get<Return[]>(this.basePath);
    return response.data;
  }

  async findById(id: string): Promise<Return | null> {
    try {
      const response = await apiClient.get<Return>(`${this.basePath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async findByWarehouse(warehouseId: string): Promise<Return[]> {
    const response = await apiClient.get<Return[]>(`${this.basePath}/warehouse/${warehouseId}`);
    return response.data;
  }

  async findByType(type: ReturnType): Promise<Return[]> {
    const response = await apiClient.get<Return[]>(`${this.basePath}/type/${type}`);
    return response.data;
  }

  async findByStatus(status: ReturnStatus): Promise<Return[]> {
    const response = await apiClient.get<Return[]>(`${this.basePath}/status/${status}`);
    return response.data;
  }

  async create(data: CreateReturnData): Promise<Return> {
    const response = await apiClient.post<Return>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateReturnData): Promise<Return> {
    const response = await apiClient.put<Return>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async confirm(id: string): Promise<Return> {
    const response = await apiClient.post<Return>(`${this.basePath}/${id}/confirm`);
    return response.data;
  }

  async cancel(id: string): Promise<Return> {
    const response = await apiClient.post<Return>(`${this.basePath}/${id}/cancel`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async deleteAll(ids: string[]): Promise<void> {
    await apiClient.delete(`${this.basePath}/batch`, { data: ids });
  }
}
