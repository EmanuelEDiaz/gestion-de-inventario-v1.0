import { apiClient } from '@/infrastructure/api/client';
import type { ITransferRepository } from '@/core/transfer/ports/ITransferRepository';
import type { Transfer, CreateTransferRequest, UpdateTransferRequest, TransferStatus } from '@/core/transfer/entities/transfer';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';

const uuid = () => crypto.randomUUID();

/**
 * Adapter: Implementación HTTP+IDB del repositorio de transferencias.
 * Reads: siempre desde IDB. Writes: HTTP-first con outbox fallback en offline (Tipo B).
 */
export class TransferRepository implements ITransferRepository {
  private readonly baseUrl = '/api/v1/transfers';

  private async getCachedAll(): Promise<Transfer[]> {
    const db = await getDB();
    return (await db.getAll('transfers')) as unknown as Transfer[];
  }

  async findAll(): Promise<Transfer[]> {
    return this.getCachedAll();
  }

  async findById(id: string): Promise<Transfer> {
    const db = await getDB();
    const cached = (await db.get('transfers', id)) as Transfer | undefined;
    if (!cached) throw new Error(`Transferencia no encontrada en caché: ${id}`);
    return cached;
  }

  async findByFromWarehouse(warehouseId: string): Promise<Transfer[]> {
    const items = await this.getCachedAll();
    return items.filter((t) => t.fromWarehouseId === warehouseId);
  }

  async findByToWarehouse(warehouseId: string): Promise<Transfer[]> {
    const items = await this.getCachedAll();
    return items.filter((t) => t.toWarehouseId === warehouseId);
  }

  async findByWarehouse(warehouseId: string): Promise<Transfer[]> {
    const items = await this.getCachedAll();
    return items.filter((t) => t.fromWarehouseId === warehouseId || t.toWarehouseId === warehouseId);
  }

  async findByStatus(status: TransferStatus): Promise<Transfer[]> {
    const items = await this.getCachedAll();
    return items.filter((t) => t.status === status);
  }

  private async tryOrOutbox(op: () => Promise<Transfer>, entityId: string, action: string, payload: unknown): Promise<Transfer> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        return await op();
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({ operationId: uuid(), entityType: 'TRANSFER', entityId, action, payload });
    return { id: entityId } as unknown as Transfer;
  }

  async create(data: CreateTransferRequest): Promise<Transfer> {
    const id = `temp_${uuid()}`;
    return this.tryOrOutbox(
      async () => (await apiClient.post<Transfer>(this.baseUrl, data)).data,
      id,
      'CREATE',
      data,
    );
  }

  async update(id: string, data: UpdateTransferRequest): Promise<Transfer> {
    return this.tryOrOutbox(
      async () => (await apiClient.put<Transfer>(`${this.baseUrl}/${id}`, data)).data,
      id,
      'UPDATE',
      { id, ...data },
    );
  }

  async confirm(id: string): Promise<Transfer> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Transfer>(`${this.baseUrl}/${id}/confirm`)).data,
      id,
      'CONFIRM',
      { id },
    );
  }

  async ship(id: string): Promise<Transfer> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Transfer>(`${this.baseUrl}/${id}/ship`)).data,
      id,
      'SHIP',
      { id },
    );
  }

  async complete(id: string, receivedDate?: string): Promise<Transfer> {
    return this.tryOrOutbox(
      async () => {
        const url = receivedDate
          ? `${this.baseUrl}/${id}/complete?receivedDate=${receivedDate}`
          : `${this.baseUrl}/${id}/complete`;
        return (await apiClient.post<Transfer>(url)).data;
      },
      id,
      'COMPLETE',
      { id, receivedDate },
    );
  }

  async cancel(id: string): Promise<Transfer> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Transfer>(`${this.baseUrl}/${id}/cancel`)).data,
      id,
      'CANCEL',
      { id },
    );
  }

  async delete(id: string): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.baseUrl}/${id}`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.delete('transfers', id);
        }, 'TransferRepository.delete');
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({ operationId: uuid(), entityType: 'TRANSFER', entityId: id, action: 'DELETE', payload: { id } });
  }

  async deleteAll(ids: string[]): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.baseUrl}/batch`, { data: ids });
        await safeCacheWrite(async () => {
          const db = await getDB();
          const tx = db.transaction('transfers', 'readwrite');
          for (const id of ids) await tx.store.delete(id);
          await tx.done;
        }, 'TransferRepository.deleteAll');
        return;
      } catch {
        // fall through to outbox
      }
    }
    for (const id of ids) {
      await addToOutbox({ operationId: uuid(), entityType: 'TRANSFER', entityId: id, action: 'DELETE', payload: { id } });
    }
  }
}
