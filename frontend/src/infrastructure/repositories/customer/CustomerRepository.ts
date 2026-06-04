import { apiClient } from '@/infrastructure/api/client';
import type { ICustomerRepository } from '@/core/customer/ports/ICustomerRepository';
import type { Customer, CreateCustomerData, UpdateCustomerData } from '@/core/customer/entities/customer';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB } from '@/infrastructure/storage/db';

function normalize(customer: Customer) {
  return { ...customer, nameLower: customer.name.toLowerCase(), cachedAt: Date.now() };
}

export class CustomerRepository implements ICustomerRepository {
  private readonly basePath = '/api/v1/customers';

  async findAll(): Promise<Customer[]> {
    const db = await getDB();
    return db.getAll('customers') as unknown as Customer[];
  }

  async findById(id: string): Promise<Customer | null> {
    const db = await getDB();
    const cached = await db.get('customers', id);
    return (cached ?? null) as Customer | null;
  }

  async findByActive(active: boolean): Promise<Customer[]> {
    const db = await getDB();
    const all = await db.getAll('customers') as unknown as Customer[];
    return all.filter(c => c.active === active);
  }

  async findByCode(code: string): Promise<Customer | null> {
    const db = await getDB();
    const cached = await db.getFromIndex('customers', 'by-code', code);
    return (cached ?? null) as Customer | null;
  }

  async search(query: string): Promise<Customer[]> {
    const db = await getDB();
    const all = await db.getAll('customers') as unknown as Customer[];
    const lower = query.toLowerCase();
    return all.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      (c.code && c.code.toLowerCase().includes(lower)) ||
      (c.email && c.email.toLowerCase().includes(lower))
    );
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const mode = getNetworkMode();
    if (mode === 'online-direct') {
      const response = await apiClient.post<Customer>(this.basePath, data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless, type mismatch is compile-time only
      await getDB().then(db => db.put('customers', normalize(response.data) as any));
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Customer>(this.basePath, data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless, type mismatch is compile-time only
        await getDB().then(db => db.put('customers', normalize(response.data) as any));
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless, type mismatch is compile-time only
      await getDB().then(db => db.put('customers', normalize(response.data) as any));
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.put<Customer>(`${this.basePath}/${id}`, data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless, type mismatch is compile-time only
        await getDB().then(db => db.put('customers', normalize(response.data) as any));
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
      await getDB().then(db => db.put('customers', normalize(response.data) as any));
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Customer>(`${this.basePath}/${id}/activate`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
        await getDB().then(db => db.put('customers', normalize(response.data) as any));
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
      await getDB().then(db => db.put('customers', normalize(response.data) as any));
      return response.data;
    }
    if (mode === 'online-degraded') {
      try {
        const response = await apiClient.post<Customer>(`${this.basePath}/${id}/deactivate`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
        await getDB().then(db => db.put('customers', normalize(response.data) as any));
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
      await getDB().then(db => db.delete('customers', id));
      return;
    }
    if (mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/${id}`);
        await getDB().then(db => db.delete('customers', id));
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
      const db = await getDB();
      const tx = db.transaction('customers', 'readwrite');
      for (const id of ids) await tx.store.delete(id);
      await tx.done;
      return;
    }
    if (mode === 'online-degraded') {
      try {
        await apiClient.delete(`${this.basePath}/batch`, { data: ids });
        const db = await getDB();
        const tx = db.transaction('customers', 'readwrite');
        for (const id of ids) await tx.store.delete(id);
        await tx.done;
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
