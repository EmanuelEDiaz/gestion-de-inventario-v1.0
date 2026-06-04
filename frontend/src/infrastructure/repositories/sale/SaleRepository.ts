import { apiClient } from '@/infrastructure/api/client';
import { ISaleRepository } from '@/core/sale/ports/ISaleRepository';
import { Sale, SaleFilter, CreateSaleInput } from '@/core/sale/entities/sale';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';

const uuid = () => crypto.randomUUID();

export class SaleRepository implements ISaleRepository {
  private basePath = '/api/v1/sales';

  private async getCachedAll(): Promise<Sale[]> {
    const db = await getDB();
    return (await db.getAll('sales')) as unknown as Sale[];
  }

  async getById(id: string): Promise<Sale | null> {
    const db = await getDB();
    const cached = (await db.get('sales', id)) as Sale | undefined;
    return cached ?? null;
  }

  async getByNumber(saleNumber: string): Promise<Sale | null> {
    const items = await this.getCachedAll();
    return items.find((s) => s.saleNumber === saleNumber) ?? null;
  }

  async getAll(filter?: SaleFilter): Promise<Sale[]> {
    const items = await this.getCachedAll();
    if (!filter) return items;
    return items.filter((s) => {
      if (filter.customerId && s.customerId !== filter.customerId) return false;
      if (filter.warehouseId && s.warehouseId !== filter.warehouseId) return false;
      if (filter.status && s.status !== filter.status) return false;
      if (filter.fromDate && s.createdAt && s.createdAt < filter.fromDate) return false;
      if (filter.toDate && s.createdAt && s.createdAt > filter.toDate) return false;
      return true;
    });
  }

  private async tryOrOutbox(op: () => Promise<Sale>, entityId: string, action: string, payload: unknown): Promise<Sale> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        return await op();
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({ operationId: uuid(), entityType: 'SALE', entityId, action, payload });
    return { id: entityId, saleNumber: `PEND-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as Sale;
  }

  async create(input: CreateSaleInput): Promise<Sale> {
    const id = `temp_${uuid()}`;
    return this.tryOrOutbox(
      async () => (await apiClient.post<Sale>(this.basePath, input)).data,
      id,
      'CREATE',
      input,
    );
  }

  async confirm(id: string): Promise<Sale> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Sale>(`${this.basePath}/${id}/confirm`)).data,
      id,
      'CONFIRM',
      { id },
    );
  }

  async deliver(id: string): Promise<Sale> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Sale>(`${this.basePath}/${id}/deliver`)).data,
      id,
      'DELIVER',
      { id },
    );
  }

  async cancel(id: string): Promise<Sale> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Sale>(`${this.basePath}/${id}/cancel`)).data,
      id,
      'CANCEL',
      { id },
    );
  }

  async delete(id: string): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/${id}`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.delete('sales', id);
        }, 'SaleRepository.delete');
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({ operationId: uuid(), entityType: 'SALE', entityId: id, action: 'DELETE', payload: { id } });
  }

  async deleteAll(ids: string[]): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
        await safeCacheWrite(async () => {
          const db = await getDB();
          const tx = db.transaction('sales', 'readwrite');
          for (const id of ids) await tx.store.delete(id);
          await tx.done;
        }, 'SaleRepository.deleteAll');
        return;
      } catch {
        // fall through to outbox
      }
    }
    for (const id of ids) {
      await addToOutbox({ operationId: uuid(), entityType: 'SALE', entityId: id, action: 'DELETE', payload: { id } });
    }
  }
}

export const saleRepository = new SaleRepository();
