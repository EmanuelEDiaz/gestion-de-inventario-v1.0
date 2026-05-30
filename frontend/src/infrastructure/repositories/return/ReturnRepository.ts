import { apiClient } from '@/infrastructure/api/client';
import type { IReturnRepository } from '@/core/return/ports/IReturnRepository';
import type { Return, ReturnType, ReturnStatus, CreateReturnData, UpdateReturnData } from '@/core/return/entities/return';
import { readWithCache, isOnline } from '@/infrastructure/storage/networkAwareUtils';
import { getCachedReturns } from '@/infrastructure/storage/db';

/**
 * Adapter: Implementación HTTP del repositorio de devoluciones.
 */
export class ReturnRepository implements IReturnRepository {
  private readonly basePath = '/api/v1/returns';

  async findAll(): Promise<Return[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Return[]>(this.basePath);
        return response.data;
      },
      async () => getCachedReturns() as unknown as Return[],
    );
  }

  async findById(id: string): Promise<Return | null> {
    return readWithCache(
      async () => {
        try {
          const response = await apiClient.get<Return>(`${this.basePath}/${id}`);
          return response.data;
        } catch {
          return null;
        }
      },
      async () => {
        const returns = await getCachedReturns();
        const ret = returns.find(r => r.id === id);
        return ret as unknown as Return ?? null;
      },
    );
  }

  async findByWarehouse(warehouseId: string): Promise<Return[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Return[]>(`${this.basePath}/warehouse/${warehouseId}`);
        return response.data;
      },
      async () => {
        const returns = await getCachedReturns();
        // Nota: CachedReturn no tiene warehouseId, retornamos todos
        return returns as unknown as Return[];
      },
    );
  }

  async findByType(type: ReturnType): Promise<Return[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Return[]>(`${this.basePath}/type/${type}`);
        return response.data;
      },
      async () => {
        const returns = await getCachedReturns();
        return returns.filter(r => r.type === type) as unknown as Return[];
      },
    );
  }

  async findByStatus(status: ReturnStatus): Promise<Return[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Return[]>(`${this.basePath}/status/${status}`);
        return response.data;
      },
      async () => {
        const returns = await getCachedReturns();
        // Nota: CachedReturn no tiene status, filtramos del cache general
        return returns as unknown as Return[];
      },
    );
  }

  async create(data: CreateReturnData): Promise<Return> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para crear devoluciones');
    }
    const response = await apiClient.post<Return>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateReturnData): Promise<Return> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para actualizar devoluciones');
    }
    const response = await apiClient.put<Return>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async confirm(id: string): Promise<Return> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para confirmar devoluciones');
    }
    const response = await apiClient.post<Return>(`${this.basePath}/${id}/confirm`);
    return response.data;
  }

  async cancel(id: string): Promise<Return> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para cancelar devoluciones');
    }
    const response = await apiClient.post<Return>(`${this.basePath}/${id}/cancel`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para eliminar devoluciones');
    }
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async deleteAll(ids: string[]): Promise<void> {
    if (!isOnline()) {
      throw new Error('Requiere conexión a internet para eliminar devoluciones');
    }
    await apiClient.delete(`${this.basePath}/batch`, { data: ids });
  }
}
