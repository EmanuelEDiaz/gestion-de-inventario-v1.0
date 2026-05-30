import { apiClient } from '@/infrastructure/api/client';
import { IPurchaseRepository } from '@/core/purchase/ports/IPurchaseRepository';
import { Purchase, PurchaseFilter, CreatePurchaseInput } from '@/core/purchase/entities/purchase';
import { isOnline } from '@/infrastructure/storage/networkAwareUtils';
import { addToOutbox } from '@/infrastructure/storage/outbox';

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
    if (!isOnline()) {
      const id = `temp_${crypto.randomUUID()}`;
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'PURCHASE', entityId: id,
        action: 'CREATE', payload: input,
      });
      return { id, purchaseNumber: `PEND-${Date.now()}`, ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as Purchase;
    }
    const response = await apiClient.post<Purchase>(this.basePath, input);
    return response.data;
  }

  async confirm(id: string): Promise<Purchase> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'PURCHASE', entityId: id,
        action: 'CONFIRM', payload: { id },
      });
      return { id } as Purchase;
    }
    const response = await apiClient.post<Purchase>(`${this.basePath}/${id}/confirm`);
    return response.data;
  }

  async receive(id: string, receivedDate?: string): Promise<Purchase> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'PURCHASE', entityId: id,
        action: 'RECEIVE', payload: { id, receivedDate },
      });
      return { id } as Purchase;
    }
    const response = await apiClient.post<Purchase>(`${this.basePath}/${id}/receive`, null, {
      params: receivedDate ? { receivedDate } : undefined
    });
    return response.data;
  }

  async cancel(id: string): Promise<Purchase> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'PURCHASE', entityId: id,
        action: 'CANCEL', payload: { id },
      });
      return { id } as Purchase;
    }
    const response = await apiClient.post<Purchase>(`${this.basePath}/${id}/cancel`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'PURCHASE', entityId: id,
        action: 'DELETE', payload: { id },
      });
      return;
    }
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async deleteAll(ids: string[]): Promise<void> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'PURCHASE', entityId: `batch_${Date.now()}`,
        action: 'DELETE', payload: { ids },
      });
      return;
    }
    await apiClient.delete(`${this.basePath}/batch`, { data: ids });
  }
}

export const purchaseRepository = new PurchaseRepository();
