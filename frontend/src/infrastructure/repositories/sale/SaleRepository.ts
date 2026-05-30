import { apiClient } from '@/infrastructure/api/client';
import { ISaleRepository } from '@/core/sale/ports/ISaleRepository';
import { Sale, SaleFilter, CreateSaleInput } from '@/core/sale/entities/sale';
import { isOnline } from '@/infrastructure/storage/networkAwareUtils';
import { addToOutbox } from '@/infrastructure/storage/outbox';

export class SaleRepository implements ISaleRepository {
  private basePath = '/api/v1/sales';

  async getById(id: string): Promise<Sale | null> {
    try {
      const response = await apiClient.get<Sale>(`${this.basePath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getByNumber(saleNumber: string): Promise<Sale | null> {
    try {
      const response = await apiClient.get<Sale>(`${this.basePath}/number/${saleNumber}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getAll(filter?: SaleFilter): Promise<Sale[]> {
    const response = await apiClient.get<Sale[]>(this.basePath, { params: filter });
    return response.data;
  }

  async create(input: CreateSaleInput): Promise<Sale> {
    if (!isOnline()) {
      const id = `temp_${crypto.randomUUID()}`;
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SALE', entityId: id,
        action: 'CREATE', payload: input,
      });
      return { id, saleNumber: `PEND-${Date.now()}`, ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as Sale;
    }
    const response = await apiClient.post<Sale>(this.basePath, input);
    return response.data;
  }

  async confirm(id: string): Promise<Sale> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SALE', entityId: id,
        action: 'CONFIRM', payload: { id },
      });
      return { id } as Sale;
    }
    const response = await apiClient.post<Sale>(`${this.basePath}/${id}/confirm`);
    return response.data;
  }

  async deliver(id: string): Promise<Sale> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SALE', entityId: id,
        action: 'DELIVER', payload: { id },
      });
      return { id } as Sale;
    }
    const response = await apiClient.post<Sale>(`${this.basePath}/${id}/deliver`);
    return response.data;
  }

  async cancel(id: string): Promise<Sale> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SALE', entityId: id,
        action: 'CANCEL', payload: { id },
      });
      return { id } as Sale;
    }
    const response = await apiClient.post<Sale>(`${this.basePath}/${id}/cancel`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SALE', entityId: id,
        action: 'DELETE', payload: { id },
      });
      return;
    }
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async deleteAll(ids: string[]): Promise<void> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SALE', entityId: `batch_${Date.now()}`,
        action: 'DELETE', payload: { ids },
      });
      return;
    }
    await apiClient.delete(`${this.basePath}/batch`, { data: ids });
  }
}

export const saleRepository = new SaleRepository();
