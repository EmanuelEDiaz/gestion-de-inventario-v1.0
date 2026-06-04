import { apiClient } from '@/infrastructure/api/client';
import { IPurchaseRepository } from '@/core/purchase/ports/IPurchaseRepository';
import { Purchase, PurchaseFilter, CreatePurchaseInput } from '@/core/purchase/entities/purchase';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';

const uuid = () => crypto.randomUUID();

export class PurchaseRepository implements IPurchaseRepository {
  private basePath = '/api/v1/purchases';

  private async getCachedAll(): Promise<Purchase[]> {
    const db = await getDB();
    return (await db.getAll('purchases')) as unknown as Purchase[];
  }

  async getById(id: string): Promise<Purchase | null> {
    const db = await getDB();
    const cached = (await db.get('purchases', id)) as Purchase | undefined;
    return cached ?? null;
  }

  async getByNumber(purchaseNumber: string): Promise<Purchase | null> {
    const items = await this.getCachedAll();
    return items.find((p) => p.purchaseNumber === purchaseNumber) ?? null;
  }

  async getAll(filter?: PurchaseFilter): Promise<Purchase[]> {
    const items = await this.getCachedAll();
    if (!filter) return items;
    return items.filter((p) => {
      if (filter.warehouseId && p.warehouseId !== filter.warehouseId) return false;
      if (filter.supplierId && p.supplierId !== filter.supplierId) return false;
      if (filter.status && p.status !== filter.status) return false;
      if (filter.fromDate && p.createdAt && p.createdAt < filter.fromDate) return false;
      if (filter.toDate && p.createdAt && p.createdAt > filter.toDate) return false;
      return true;
    });
  }

  private async tryOrOutbox(op: () => Promise<Purchase>, entityId: string, action: string, payload: unknown): Promise<Purchase> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        return await op();
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({ operationId: uuid(), entityType: 'PURCHASE', entityId, action, payload });
    return { id: entityId, purchaseNumber: `PEND-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as Purchase;
  }

  async create(input: CreatePurchaseInput): Promise<Purchase> {
    const id = `temp_${uuid()}`;
    return this.tryOrOutbox(
      async () => (await apiClient.post<Purchase>(this.basePath, input)).data,
      id,
      'CREATE',
      input,
    );
  }

  async confirm(id: string): Promise<Purchase> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Purchase>(`${this.basePath}/${id}/confirm`)).data,
      id,
      'CONFIRM',
      { id },
    );
  }

  async receive(id: string, receivedDate?: string): Promise<Purchase> {
    return this.tryOrOutbox(
      async () => {
        const response = await apiClient.post<Purchase>(`${this.basePath}/${id}/receive`, null, {
          params: receivedDate ? { receivedDate } : undefined,
        });
        return response.data;
      },
      id,
      'RECEIVE',
      { id, receivedDate },
    );
  }

  async cancel(id: string): Promise<Purchase> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Purchase>(`${this.basePath}/${id}/cancel`)).data,
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
          await db.delete('purchases', id);
        }, 'PurchaseRepository.delete');
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({ operationId: uuid(), entityType: 'PURCHASE', entityId: id, action: 'DELETE', payload: { id } });
  }

  async deleteAll(ids: string[]): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
        await safeCacheWrite(async () => {
          const db = await getDB();
          const tx = db.transaction('purchases', 'readwrite');
          for (const id of ids) await tx.store.delete(id);
          await tx.done;
        }, 'PurchaseRepository.deleteAll');
        return;
      } catch {
        // fall through to outbox
      }
    }
    for (const id of ids) {
      await addToOutbox({ operationId: uuid(), entityType: 'PURCHASE', entityId: id, action: 'DELETE', payload: { id } });
    }
  }
}

export const purchaseRepository = new PurchaseRepository();
