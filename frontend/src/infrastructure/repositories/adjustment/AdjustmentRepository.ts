import { apiClient } from '@/infrastructure/api/client';
import type { IAdjustmentRepository } from '@/core/adjustment/ports/IAdjustmentRepository';
import type {
  Adjustment,
  AdjustmentStatus,
  CreateAdjustmentData,
  UpdateAdjustmentData,
} from '@/core/adjustment/entities/adjustment';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';

const uuid = () => crypto.randomUUID();

/**
 * Adapter: Implementación HTTP+IDB del repositorio de ajustes.
 * Reads: siempre desde IDB. Writes: HTTP-first con outbox fallback en offline (Tipo B).
 */
export class AdjustmentRepository implements IAdjustmentRepository {
  private readonly basePath = '/api/v1/adjustments';

  private async getCachedAll(): Promise<Adjustment[]> {
    const db = await getDB();
    return (await db.getAll('adjustments')) as unknown as Adjustment[];
  }

  async findAll(): Promise<Adjustment[]> {
    return this.getCachedAll();
  }

  async findById(id: string): Promise<Adjustment | null> {
    const db = await getDB();
    const cached = (await db.get('adjustments', id)) as Adjustment | undefined;
    return cached ?? null;
  }

  async findByWarehouse(warehouseId: string): Promise<Adjustment[]> {
    const items = await this.getCachedAll();
    return items.filter((a) => a.warehouseId === warehouseId);
  }

  async findByStatus(status: AdjustmentStatus): Promise<Adjustment[]> {
    const items = await this.getCachedAll();
    return items.filter((a) => a.status === status);
  }

  private async tryOrOutbox(op: () => Promise<Adjustment>, entityId: string, action: string, payload: unknown): Promise<Adjustment> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        return await op();
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({ operationId: uuid(), entityType: 'ADJUSTMENT', entityId, action, payload });
    return { id: entityId } as unknown as Adjustment;
  }

  async create(data: CreateAdjustmentData): Promise<Adjustment> {
    const id = `temp_${uuid()}`;
    return this.tryOrOutbox(
      async () => (await apiClient.post<Adjustment>(this.basePath, data)).data,
      id,
      'CREATE',
      data,
    );
  }

  async update(id: string, data: UpdateAdjustmentData): Promise<Adjustment> {
    return this.tryOrOutbox(
      async () => (await apiClient.put<Adjustment>(`${this.basePath}/${id}`, data)).data,
      id,
      'UPDATE',
      { id, ...data },
    );
  }

  async confirm(id: string): Promise<Adjustment> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Adjustment>(`${this.basePath}/${id}/confirm`)).data,
      id,
      'CONFIRM',
      { id },
    );
  }

  async cancel(id: string): Promise<Adjustment> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Adjustment>(`${this.basePath}/${id}/cancel`)).data,
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
          await db.delete('adjustments', id);
        }, 'AdjustmentRepository.delete');
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({ operationId: uuid(), entityType: 'ADJUSTMENT', entityId: id, action: 'DELETE', payload: { id } });
  }

  async deleteAll(ids: string[]): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
        await safeCacheWrite(async () => {
          const db = await getDB();
          const tx = db.transaction('adjustments', 'readwrite');
          for (const id of ids) await tx.store.delete(id);
          await tx.done;
        }, 'AdjustmentRepository.deleteAll');
        return;
      } catch {
        // fall through to outbox
      }
    }
    for (const id of ids) {
      await addToOutbox({ operationId: uuid(), entityType: 'ADJUSTMENT', entityId: id, action: 'DELETE', payload: { id } });
    }
  }
}
