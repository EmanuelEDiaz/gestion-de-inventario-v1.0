import { apiClient } from '@/infrastructure/api/client';
import type { ICustomerRepository } from '@/core/customer/ports/ICustomerRepository';
import type { Customer, CreateCustomerData, UpdateCustomerData } from '@/core/customer/entities/customer';
import { isOnline, readWithCache } from '@/infrastructure/storage/networkAwareUtils';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB } from '@/infrastructure/storage/db';

export class CustomerRepository implements ICustomerRepository {
  private readonly basePath = '/api/v1/customers';

  async findAll(): Promise<Customer[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Customer[]>(this.basePath);
        return response.data;
      },
      async () => {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return db.getAll('customers') as any;
      },
    );
  }

  async findById(id: string): Promise<Customer | null> {
    return readWithCache(
      async () => {
        try {
          const response = await apiClient.get<Customer>(`${this.basePath}/${id}`);
          return response.data;
        } catch {
          return null;
        }
      },
      async () => {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cached = await db.get('customers', id) as any;
        return cached ?? null;
      },
    );
  }

  async findByActive(active: boolean): Promise<Customer[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Customer[]>(`${this.basePath}?active=${active}`);
        return response.data;
      },
      async () => {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return db.getAll('customers') as any;
      },
    );
  }

  async findByCode(code: string): Promise<Customer | null> {
    return readWithCache(
      async () => {
        try {
          const response = await apiClient.get<Customer>(`${this.basePath}/code/${code}`);
          return response.data;
        } catch {
          return null;
        }
      },
      async () => {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cached = await db.getFromIndex('customers', 'by-code', code) as any;
        return cached ?? null;
      },
    );
  }

  async search(query: string): Promise<Customer[]> {
    return readWithCache(
      async () => {
        const response = await apiClient.get<Customer[]>(`${this.basePath}/search?q=${query}`);
        return response.data;
      },
      async () => {
        const db = await getDB();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return db.getAll('customers') as any;
      },
    );
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    if (!isOnline()) {
      const id = `temp_${crypto.randomUUID()}`;
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
        action: 'CREATE', payload: data,
      });
      return { id, ...data, createdAt: new Date().toISOString() } as unknown as Customer;
    }
    const response = await apiClient.post<Customer>(this.basePath, data);
    return response.data;
  }

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
        action: 'UPDATE', payload: data,
      });
      return { id, ...data } as unknown as Customer;
    }
    const response = await apiClient.put<Customer>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async activate(id: string): Promise<Customer> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
        action: 'ACTIVATE', payload: {},
      });
      return { id } as Customer;
    }
    const response = await apiClient.post<Customer>(`${this.basePath}/${id}/activate`);
    return response.data;
  }

  async deactivate(id: string): Promise<Customer> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
        action: 'DEACTIVATE', payload: {},
      });
      return { id } as Customer;
    }
    const response = await apiClient.post<Customer>(`${this.basePath}/${id}/deactivate`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
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
          operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
          action: 'DELETE', payload: {},
        });
      }
      return;
    }
    await apiClient.delete(`${this.basePath}/batch`, { data: ids });
  }
}
