import { apiClient } from '@/infrastructure/api/client';
import type { ISupplierRepository } from '@/core/supplier/ports/ISupplierRepository';
import type { Supplier, CreateSupplierData, UpdateSupplierData } from '@/core/supplier/entities/supplier';
import { isOnline, readWithCache } from '@/infrastructure/storage/networkAwareUtils';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB } from '@/infrastructure/storage/db';

export class SupplierRepository implements ISupplierRepository {
  private readonly basePath = '/api/v1/suppliers';

  async findAll(): Promise<Supplier[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Supplier[]>(this.basePath);
        return response.data;
      },
      async () => {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return db.getAll('suppliers') as any;
      },
    );
  }

  async findById(id: string): Promise<Supplier | null> {
    return readWithCache(
      async () => {
        try {
          const response = await apiClient.get<Supplier>(`${this.basePath}/${id}`);
          return response.data;
        } catch {
          return null;
        }
      },
      async () => {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cached = await db.get('suppliers', id) as any;
        return cached ?? null;
      },
    );
  }

  async findByActive(active: boolean): Promise<Supplier[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Supplier[]>(`${this.basePath}?active=${active}`);
        return response.data;
      },
      async () => {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return db.getAll('suppliers') as any;
      },
    );
  }

  async findByCode(code: string): Promise<Supplier | null> {
    return readWithCache(
      async () => {
        try {
          const response = await apiClient.get<Supplier>(`${this.basePath}/code/${code}`);
          return response.data;
        } catch {
          return null;
        }
      },
      async () => {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cached = await db.getFromIndex('suppliers', 'by-code', code) as any;
        return cached ?? null;
      },
    );
  }

  async search(query: string): Promise<Supplier[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Supplier[]>(`${this.basePath}/search?q=${query}`);
        return response.data;
      },
      async () => {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return db.getAll('suppliers') as any;
      },
    );
  }

  async create(data: CreateSupplierData): Promise<Supplier> {
    if (!isOnline()) {
      const id = `temp_${crypto.randomUUID()}`;
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SUPPLIER', entityId: id,
        action: 'CREATE', payload: data,
      });
      return { id, ...data, createdAt: new Date().toISOString() } as unknown as Supplier;
    }
    const response = await apiClient.post<Supplier>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateSupplierData): Promise<Supplier> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SUPPLIER', entityId: id,
        action: 'UPDATE', payload: data,
      });
      return { id, ...data } as unknown as Supplier;
    }
    const response = await apiClient.put<Supplier>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async activate(id: string): Promise<Supplier> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SUPPLIER', entityId: id,
        action: 'ACTIVATE', payload: {},
      });
      return { id } as Supplier;
    }
    const response = await apiClient.post<Supplier>(`${this.basePath}/${id}/activate`);
    return response.data;
  }

  async deactivate(id: string): Promise<Supplier> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SUPPLIER', entityId: id,
        action: 'DEACTIVATE', payload: {},
      });
      return { id } as Supplier;
    }
    const response = await apiClient.post<Supplier>(`${this.basePath}/${id}/deactivate`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'SUPPLIER', entityId: id,
        action: 'DELETE', payload: {},
      });
      return;
    }
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async deleteAll(ids: string[]): Promise<void> {
    if (!isOnline()) {
      for (const id of ids) {
        await addToOutbox({
          operationId: crypto.randomUUID(), entityType: 'SUPPLIER', entityId: id,
          action: 'DELETE', payload: {},
        });
      }
      return;
    }
    await apiClient.delete(`${this.basePath}/batch`, { data: ids });
  }
}
