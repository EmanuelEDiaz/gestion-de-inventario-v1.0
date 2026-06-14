import { apiClient, isClientError } from '@/infrastructure/api/client';
import type { IReturnRepository } from '@/core/return/ports/IReturnRepository';
import type { Return, ReturnType, ReturnStatus, CreateReturnData, UpdateReturnData } from '@/core/return/entities/return';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';

const uuid = () => crypto.randomUUID();

/**
 * Adapter: Implementación HTTP+IDB del repositorio de devoluciones.
 * Reads: siempre desde IDB. Writes: HTTP-first con outbox fallback en offline.
 */
export class ReturnRepository implements IReturnRepository {
  private readonly basePath = '/api/v1/returns';

  private async getCachedAll(): Promise<Return[]> {
    const db = await getDB();
    return (await db.getAll('returns')) as unknown as Return[];
  }

  async findAll(): Promise<Return[]> {
    return this.getCachedAll();
  }

  async findById(id: string): Promise<Return | null> {
    const db = await getDB();
    const cached = (await db.get('returns', id)) as Return | undefined;
    return cached ?? null;
  }

  async findByWarehouse(warehouseId: string): Promise<Return[]> {
    const items = await this.getCachedAll();
    return items.filter((r) => (r as Return & { warehouseId?: string }).warehouseId === warehouseId);
  }

  async findByType(type: ReturnType): Promise<Return[]> {
    const items = await this.getCachedAll();
    return items.filter((r) => r.type === type);
  }

  async findByStatus(status: ReturnStatus): Promise<Return[]> {
    const items = await this.getCachedAll();
    return items.filter((r) => r.status === status);
  }

  private async tryOrOutbox(op: () => Promise<Return>, entityId: string, action: string, payload: unknown): Promise<Return> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        return await op();
      } catch (err) {
        if (isClientError(err)) throw err;
        // fall through to outbox
      }
    }
    await addToOutbox({ operationId: uuid(), entityType: 'RETURN', entityId, action, payload });
    return { id: entityId } as unknown as Return;
  }

  async create(data: CreateReturnData): Promise<Return> {
    const id = `temp_${uuid()}`;
    return this.tryOrOutbox(
      async () => (await apiClient.post<Return>(this.basePath, data)).data,
      id,
      'CREATE',
      data,
    );
  }

  async update(id: string, data: UpdateReturnData): Promise<Return> {
    return this.tryOrOutbox(
      async () => (await apiClient.put<Return>(`${this.basePath}/${id}`, data)).data,
      id,
      'UPDATE',
      { id, ...data },
    );
  }

  async confirm(id: string): Promise<Return> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Return>(`${this.basePath}/${id}/confirm`)).data,
      id,
      'CONFIRM',
      { id },
    );
  }

  async cancel(id: string): Promise<Return> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Return>(`${this.basePath}/${id}/cancel`)).data,
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
          await db.delete('returns', id);
        }, 'ReturnRepository.delete');
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({ operationId: uuid(), entityType: 'RETURN', entityId: id, action: 'DELETE', payload: { id } });
  }

  async deleteAll(ids: string[]): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
        await safeCacheWrite(async () => {
          const db = await getDB();
          const tx = db.transaction('returns', 'readwrite');
          for (const id of ids) await tx.store.delete(id);
          await tx.done;
        }, 'ReturnRepository.deleteAll');
        return;
      } catch {
        // fall through to outbox
      }
    }
    for (const id of ids) {
      await addToOutbox({ operationId: uuid(), entityType: 'RETURN', entityId: id, action: 'DELETE', payload: { id } });
    }
  }
}
