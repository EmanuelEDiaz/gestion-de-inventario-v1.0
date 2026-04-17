import { apiClient } from '@/presentation/shared/lib/api-client';
import type { ITransferRepository } from '@/core/interfaces/ITransferRepository';
import type { Transfer, CreateTransferRequest, UpdateTransferRequest, TransferStatus } from '@/core/entities/transfer';

/**
 * Adapter: Implementa ITransferRepository usando HTTP.
 * (hexagonal: adapter depende de port)
 */
export class TransferRepository implements ITransferRepository {
  private readonly baseUrl = '/api/v1/transfers';

  async findAll(): Promise<Transfer[]> {
    const response = await apiClient.get<Transfer[]>(this.baseUrl);
    return response.data;
  }

  async findById(id: string): Promise<Transfer> {
    const response = await apiClient.get<Transfer>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async findByFromWarehouse(warehouseId: string): Promise<Transfer[]> {
    const response = await apiClient.get<Transfer[]>(`${this.baseUrl}/from-warehouse/${warehouseId}`);
    return response.data;
  }

  async findByToWarehouse(warehouseId: string): Promise<Transfer[]> {
    const response = await apiClient.get<Transfer[]>(`${this.baseUrl}/to-warehouse/${warehouseId}`);
    return response.data;
  }

  async findByWarehouse(warehouseId: string): Promise<Transfer[]> {
    const response = await apiClient.get<Transfer[]>(`${this.baseUrl}/warehouse/${warehouseId}`);
    return response.data;
  }

  async findByStatus(status: TransferStatus): Promise<Transfer[]> {
    const response = await apiClient.get<Transfer[]>(`${this.baseUrl}/status/${status}`);
    return response.data;
  }

  async create(data: CreateTransferRequest): Promise<Transfer> {
    const response = await apiClient.post<Transfer>(this.baseUrl, data);
    return response.data;
  }

  async update(id: string, data: UpdateTransferRequest): Promise<Transfer> {
    const response = await apiClient.put<Transfer>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async confirm(id: string): Promise<Transfer> {
    const response = await apiClient.post<Transfer>(`${this.baseUrl}/${id}/confirm`);
    return response.data;
  }

  async ship(id: string): Promise<Transfer> {
    const response = await apiClient.post<Transfer>(`${this.baseUrl}/${id}/ship`);
    return response.data;
  }

  async complete(id: string, receivedDate?: string): Promise<Transfer> {
    const url = receivedDate 
      ? `${this.baseUrl}/${id}/complete?receivedDate=${receivedDate}`
      : `${this.baseUrl}/${id}/complete`;
    const response = await apiClient.post<Transfer>(url);
    return response.data;
  }

  async cancel(id: string): Promise<Transfer> {
    const response = await apiClient.post<Transfer>(`${this.baseUrl}/${id}/cancel`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}
