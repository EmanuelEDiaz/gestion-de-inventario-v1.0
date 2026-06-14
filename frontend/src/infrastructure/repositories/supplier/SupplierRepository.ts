import { apiClient, isClientError } from '@/infrastructure/api/client';
import type { ISupplierRepository } from '@/core/supplier/ports/ISupplierRepository';
import type { Supplier, CreateSupplierData, UpdateSupplierData } from '@/core/supplier/entities/supplier';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';

export class SupplierRepository implements ISupplierRepository {
  private readonly basePath = '/api/v1/suppliers';

  async findAll(): Promise<Supplier[]> {
    const db = await getDB();
    return (await db.getAll('suppliers')) as unknown as Supplier[];
  }

  async findById(id: string): Promise<Supplier | null> {
    const db = await getDB();
    const cached = await db.get('suppliers', id);
    return (cached ?? null) as Supplier | null;
  }

  async findByActive(active: boolean): Promise<Supplier[]> {
    const db = await getDB();
    const all = (await db.getAll('suppliers')) as unknown as Supplier[];
    return all.filter((s) => s.active === active);
  }

  async findByCode(code: string): Promise<Supplier | null> {
    const db = await getDB();
    const cached = await db.getFromIndex('suppliers', 'by-code', code);
    return (cached ?? null) as Supplier | null;
  }

  async search(query: string): Promise<Supplier[]> {
    const db = await getDB();
    const all = (await db.getAll('suppliers')) as unknown as Supplier[];
    const lower = query.toLowerCase();
    return all.filter((s) =>
      s.name?.toLowerCase().includes(lower) ||
      (s.code && s.code.toLowerCase().includes(lower)) ||
      (s.email && s.email.toLowerCase().includes(lower))
    );
  }

  private async tryOrOutbox(
    op: () => Promise<Supplier>,
    entityId: string,
    action: string,
    payload: unknown,
  ): Promise<Supplier> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await op();
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('suppliers', { ...response, cachedAt: Date.now() } as any);
        }, `SupplierRepository.${action.toLowerCase()}`);
        return response;
      } catch (err) {
        if (isClientError(err)) throw err;
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'SUPPLIER', entityId,
      action, payload,
    });
    return { id: entityId, ...(payload as object) } as Supplier;
  }

  async create(data: CreateSupplierData): Promise<Supplier> {
    const id = `temp_${crypto.randomUUID()}`;
    return this.tryOrOutbox(
      async () => (await apiClient.post<Supplier>(this.basePath, data)).data,
      id,
      'CREATE',
      data,
    );
  }

  async update(id: string, data: UpdateSupplierData): Promise<Supplier> {
    return this.tryOrOutbox(
      async () => (await apiClient.put<Supplier>(`${this.basePath}/${id}`, data)).data,
      id,
      'UPDATE',
      data,
    );
  }

  async activate(id: string): Promise<Supplier> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Supplier>(`${this.basePath}/${id}/activate`)).data,
      id,
      'ACTIVATE',
      {},
    );
  }

  async deactivate(id: string): Promise<Supplier> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Supplier>(`${this.basePath}/${id}/deactivate`)).data,
      id,
      'DEACTIVATE',
      {},
    );
  }

  async delete(id: string): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/${id}`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.delete('suppliers', id);
        }, 'SupplierRepository.delete');
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'SUPPLIER', entityId: id,
      action: 'DELETE', payload: {},
    });
  }

  async deleteAll(ids: string[]): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
        await safeCacheWrite(async () => {
          const db = await getDB();
          const tx = db.transaction('suppliers', 'readwrite');
          for (const id of ids) await tx.store.delete(id);
          await tx.done;
        }, 'SupplierRepository.deleteAll');
        return;
      } catch {
        // fall through to outbox
      }
    }
    for (const id of ids) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SUPPLIER', entityId: id,
        action: 'DELETE', payload: {},
      });
    }
  }
}
