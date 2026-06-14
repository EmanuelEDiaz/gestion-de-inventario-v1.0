import { apiClient, isClientError } from '@/infrastructure/api/client';
import type { ICustomerRepository } from '@/core/customer/ports/ICustomerRepository';
import type { Customer, CreateCustomerData, UpdateCustomerData } from '@/core/customer/entities/customer';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';

function normalize(customer: Customer) {
  return { ...customer, nameLower: customer.name.toLowerCase(), cachedAt: Date.now() };
}

const uuid = () => crypto.randomUUID();

export class CustomerRepository implements ICustomerRepository {
  private readonly basePath = '/api/v1/customers';

  async findAll(): Promise<Customer[]> {
    const db = await getDB();
    return (await db.getAll('customers')) as unknown as Customer[];
  }

  async findById(id: string): Promise<Customer | null> {
    const db = await getDB();
    const cached = (await db.get('customers', id)) as Customer | undefined;
    return cached ?? null;
  }

  async findByActive(active: boolean): Promise<Customer[]> {
    const db = await getDB();
    const all = (await db.getAll('customers')) as unknown as Customer[];
    return all.filter((c) => c.active === active);
  }

  async findByCode(code: string): Promise<Customer | null> {
    const db = await getDB();
    const cached = await db.getFromIndex('customers', 'by-code', code);
    return (cached ?? null) as Customer | null;
  }

  async search(query: string): Promise<Customer[]> {
    const db = await getDB();
    const all = (await db.getAll('customers')) as unknown as Customer[];
    const lower = query.toLowerCase();
    return all.filter((c) =>
      c.name.toLowerCase().includes(lower) ||
      (c.code && c.code.toLowerCase().includes(lower)) ||
      (c.email && c.email.toLowerCase().includes(lower))
    );
  }

  private async tryOrOutbox(
    op: () => Promise<Customer>,
    entityId: string,
    action: string,
    payload: unknown,
  ): Promise<Customer> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await op();
        await safeCacheWrite(async () => {
          const db = await getDB();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IDB is schemaless
          await db.put('customers', normalize(response) as any);
        }, 'CustomerRepository.tryOrOutbox');
        return response;
      } catch (err) {
        if (isClientError(err)) throw err;
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: uuid(), entityType: 'CUSTOMER', entityId,
      action, payload,
    });
    return { id: entityId, ...(payload as object) } as Customer;
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const id = `temp_${uuid()}`;
    return this.tryOrOutbox(
      async () => (await apiClient.post<Customer>(this.basePath, data)).data,
      id,
      'CREATE',
      data,
    );
  }

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    return this.tryOrOutbox(
      async () => (await apiClient.put<Customer>(`${this.basePath}/${id}`, data)).data,
      id,
      'UPDATE',
      data,
    );
  }

  async activate(id: string): Promise<Customer> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Customer>(`${this.basePath}/${id}/activate`)).data,
      id,
      'ACTIVATE',
      {},
    );
  }

  async deactivate(id: string): Promise<Customer> {
    return this.tryOrOutbox(
      async () => (await apiClient.post<Customer>(`${this.basePath}/${id}/deactivate`)).data,
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
          await db.delete('customers', id);
        }, 'CustomerRepository.delete');
        return;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: uuid(), entityType: 'CUSTOMER', entityId: id,
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
          const tx = db.transaction('customers', 'readwrite');
          for (const id of ids) await tx.store.delete(id);
          await tx.done;
        }, 'CustomerRepository.deleteAll');
        return;
      } catch {
        // fall through to outbox
      }
    }
    for (const id of ids) {
      await addToOutbox({
        operationId: uuid(), entityType: 'CUSTOMER', entityId: id,
        action: 'DELETE', payload: {},
      });
    }
  }
}
