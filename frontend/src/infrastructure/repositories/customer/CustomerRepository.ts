import { apiClient } from '@/infrastructure/api/client';
import type { ICustomerRepository } from '@/core/customer/ports/ICustomerRepository';
import type { Customer, CreateCustomerData, UpdateCustomerData } from '@/core/customer/entities/customer';
import { readWithCache } from '@/infrastructure/storage/networkAwareUtils';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
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
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Customer>(this.basePath, data);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Customer>(this.basePath, data);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    const id = `temp_${crypto.randomUUID()}`;
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
      action: 'CREATE', payload: data,
    });
    return { id, ...data, createdAt: new Date().toISOString() } as unknown as Customer;
  }

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.put<Customer>(`${this.basePath}/${id}`, data);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.put<Customer>(`${this.basePath}/${id}`, data);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
      action: 'UPDATE', payload: data,
    });
    return { id, ...data } as unknown as Customer;
  }

  async activate(id: string): Promise<Customer> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Customer>(`${this.basePath}/${id}/activate`);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Customer>(`${this.basePath}/${id}/activate`);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
      action: 'ACTIVATE', payload: {},
    });
    return { id } as Customer;
  }

  async deactivate(id: string): Promise<Customer> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Customer>(`${this.basePath}/${id}/deactivate`);
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Customer>(`${this.basePath}/${id}/deactivate`);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
      action: 'DEACTIVATE', payload: {},
    });
    return { id } as Customer;
  }

  async delete(id: string): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      await apiClient.delete(`${this.basePath}/${id}`);
      return;
    }
    if (mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/${id}`);
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
      action: 'DELETE', payload: {},
    });
  }

  async deleteAll(ids: string[]): Promise<void> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      await apiClient.delete(`${this.basePath}/batch`, { data: ids });
      return;
    }
    if (mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
        return;
      } catch {
        // fall through to outbox
      }
    }
    for (const id of ids) {
      await addToOutbox({
        operationId: crypto.randomUUID(), entityType: 'CUSTOMER', entityId: id,
        action: 'DELETE', payload: {},
      });
    }
  }
}
