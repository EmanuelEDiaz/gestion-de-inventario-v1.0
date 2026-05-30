import { apiClient } from '@/infrastructure/api/client';
import type { ITransferRepository } from '@/core/transfer/ports/ITransferRepository';
import type { Transfer, CreateTransferRequest, UpdateTransferRequest, TransferStatus } from '@/core/transfer/entities/transfer';
import { readWithCache, isOnline } from '@/infrastructure/storage/networkAwareUtils';
import { getCachedTransfers } from '@/infrastructure/storage/db';

/**
 * Adapter: Implementa ITransferRepository usando HTTP.
 * (hexagonal: adapter depende de port)
 */
export class TransferRepository implements ITransferRepository {
  private readonly baseUrl = '/api/v1/transfers';

  async findAll(): Promise<Transfer[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Transfer[]>(this.baseUrl);
        return response.data;
      },
      async () => getCachedTransfers() as unknown as Transfer[],
    );
  }

  async findById(id: string): Promise<Transfer> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Transfer>(`${this.baseUrl}/${id}`);
        return response.data;
      },
      async () => {
        const transfers = await getCachedTransfers();
        return transfers.find(t => t.id === id) as unknown as Transfer;
      },
    );
  }

  async findByFromWarehouse(warehouseId: string): Promise<Transfer[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Transfer[]>(`${this.baseUrl}/from-warehouse/${warehouseId}`);
        return response.data;
      },
      async () => {
        const transfers = await getCachedTransfers();
        return transfers.filter(t => t.fromWarehouseId === warehouseId) as unknown as Transfer[];
      },
    );
  }

  async findByToWarehouse(warehouseId: string): Promise<Transfer[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Transfer[]>(`${this.baseUrl}/to-warehouse/${warehouseId}`);
        return response.data;
      },
      async () => {
        const transfers = await getCachedTransfers();
        return transfers.filter(t => t.toWarehouseId === warehouseId) as unknown as Transfer[];
      },
    );
  }

  async findByWarehouse(warehouseId: string): Promise<Transfer[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Transfer[]>(`${this.baseUrl}/warehouse/${warehouseId}`);
        return response.data;
      },
      async () => {
        const transfers = await getCachedTransfers();
        return transfers.filter(t => t.fromWarehouseId === warehouseId || t.toWarehouseId === warehouseId) as unknown as Transfer[];
      },
    );
  }

  async findByStatus(status: TransferStatus): Promise<Transfer[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Transfer[]>(`${this.baseUrl}/status/${status}`);
        return response.data;
      },
      async () => {
        const transfers = await getCachedTransfers();
        return transfers.filter(t => t.status === status) as unknown as Transfer[];
      },
    );
  }

  async create(data: CreateTransferRequest): Promise<Transfer> {
    if (!isOnline()) {
      throw new Error('Requiere conexión');
    }
    const response = await apiClient.post<Transfer>(this.baseUrl, data);
    return response.data;
  }

  async update(id: string, data: UpdateTransferRequest): Promise<Transfer> {
    if (!isOnline()) {
      throw new Error('Requiere conexión');
    }
    const response = await apiClient.put<Transfer>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async confirm(id: string): Promise<Transfer> {
    if (!isOnline()) {
      throw new Error('Requiere conexión');
    }
    const response = await apiClient.post<Transfer>(`${this.baseUrl}/${id}/confirm`);
    return response.data;
  }

  async ship(id: string): Promise<Transfer> {
    if (!isOnline()) {
      throw new Error('Requiere conexión');
    }
    const response = await apiClient.post<Transfer>(`${this.baseUrl}/${id}/ship`);
    return response.data;
  }

  async complete(id: string, receivedDate?: string): Promise<Transfer> {
    if (!isOnline()) {
      throw new Error('Requiere conexión');
    }
    const url = receivedDate 
      ? `${this.baseUrl}/${id}/complete?receivedDate=${receivedDate}`
      : `${this.baseUrl}/${id}/complete`;
    const response = await apiClient.post<Transfer>(url);
    return response.data;
  }

  async cancel(id: string): Promise<Transfer> {
    if (!isOnline()) {
      throw new Error('Requiere conexión');
    }
    const response = await apiClient.post<Transfer>(`${this.baseUrl}/${id}/cancel`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      throw new Error('Requiere conexión');
    }
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async deleteAll(ids: string[]): Promise<void> {
    if (!isOnline()) {
      throw new Error('Requiere conexión');
    }
    await apiClient.delete(`${this.baseUrl}/batch`, { data: ids });
  }
}
