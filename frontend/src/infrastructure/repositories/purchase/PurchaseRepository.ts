import { apiClient } from '@/infrastructure/api/client';
import { IPurchaseRepository } from '@/core/purchase/ports/IPurchaseRepository';
import { Purchase, PurchaseFilter, CreatePurchaseInput } from '@/core/purchase/entities/purchase';

export class PurchaseRepository implements IPurchaseRepository {
  private basePath = '/api/v1/purchases';

  async getById(id: string): Promise<Purchase | null> {
    try {
      const response = await apiClient.get<Purchase>(`${this.basePath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getByNumber(purchaseNumber: string): Promise<Purchase | null> {
    try {
      const response = await apiClient.get<Purchase>(`${this.basePath}/number/${purchaseNumber}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getAll(filter?: PurchaseFilter): Promise<Purchase[]> {
    const response = await apiClient.get<Purchase[]>(this.basePath, {
      params: filter
    });
    return response.data;
  }

  async create(input: CreatePurchaseInput): Promise<Purchase> {
    const response = await apiClient.post<Purchase>(this.basePath, input);
    return response.data;
  }

  async confirm(id: string): Promise<Purchase> {
    const response = await apiClient.post<Purchase>(`${this.basePath}/${id}/confirm`);
    return response.data;
  }

  async receive(id: string, receivedDate?: string): Promise<Purchase> {
    const response = await apiClient.post<Purchase>(`${this.basePath}/${id}/receive`, null, {
      params: receivedDate ? { receivedDate } : undefined
    });
    return response.data;
  }

  async cancel(id: string): Promise<Purchase> {
    const response = await apiClient.post<Purchase>(`${this.basePath}/${id}/cancel`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}

export const purchaseRepository = new PurchaseRepository();
