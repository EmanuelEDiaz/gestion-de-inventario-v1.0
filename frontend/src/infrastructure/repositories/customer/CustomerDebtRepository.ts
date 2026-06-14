import { apiClient } from '@/infrastructure/api/client';
import type { ICustomerDebtRepository } from '@/core/customer/ports/ICustomerDebtRepository';
import type { CustomerDebt, UpdateDebtData } from '@/core/customer/entities/customer-debt';
import type { DebtPayment, RegisterDebtPaymentData } from '@/core/customer/entities/debt-payment';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';

const uuid = () => crypto.randomUUID();

export class CustomerDebtRepository implements ICustomerDebtRepository {
  private readonly basePath = '/api/v1/debts';

  async findAll(status?: string): Promise<CustomerDebt[]> {
    const db = await getDB();
    const all = (await db.getAll('customerDebts')) as unknown as CustomerDebt[];
    if (status) {
      return all.filter((d) => d.status === status);
    }
    return all;
  }

  async findOverdue(): Promise<CustomerDebt[]> {
    const db = await getDB();
    const all = (await db.getAll('customerDebts')) as unknown as CustomerDebt[];
    const now = new Date().toISOString();
    return all.filter((d) =>
      d.status !== 'PAID' && d.status !== 'CANCELLED' &&
      d.dueDate !== null && d.dueDate < now
    );
  }

  async findById(id: string): Promise<CustomerDebt | null> {
    const db = await getDB();
    const cached = await db.get('customerDebts', id);
    return (cached ?? null) as CustomerDebt | null;
  }

  async findByCustomer(customerId: string): Promise<CustomerDebt[]> {
    const db = await getDB();
    return (await db.getAllFromIndex('customerDebts', 'by-customer', customerId)) as unknown as CustomerDebt[];
  }

  async update(id: string, data: UpdateDebtData): Promise<CustomerDebt> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.patch<CustomerDebt>(`${this.basePath}/${id}`, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.put('customerDebts', { ...response.data, cachedAt: Date.now() } as any);
        }, 'CustomerDebtRepository.update');
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: uuid(), entityType: 'CUSTOMER_DEBT', entityId: id,
      action: 'UPDATE', payload: data,
    });
    return { id, ...data } as unknown as CustomerDebt;
  }

  async cancel(id: string): Promise<CustomerDebt> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.post<CustomerDebt>(`${this.basePath}/${id}/cancel`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.put('customerDebts', { ...response.data, cachedAt: Date.now() } as any);
        }, 'CustomerDebtRepository.cancel');
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: uuid(), entityType: 'CUSTOMER_DEBT', entityId: id,
      action: 'CANCEL', payload: {},
    });
    return { id, status: 'CANCELLED' } as unknown as CustomerDebt;
  }

  async registerPayment(debtId: string, data: RegisterDebtPaymentData): Promise<DebtPayment> {
    const mode = getNetworkMode();
    if (mode === 'online-direct' || mode === 'online-degraded') {
      try {
        const response = await apiClient.post<DebtPayment>(`${this.basePath}/${debtId}/payments`, data);
        return response.data;
      } catch {
        // fall through to outbox
      }
    }
    await addToOutbox({
      operationId: uuid(), entityType: 'DEBT_PAYMENT', entityId: debtId,
      action: 'REGISTER_PAYMENT', payload: data,
    });
    return {
      id: `temp_${uuid()}`,
      debtId,
      amount: data.amount,
      paymentMethod: data.paymentMethod ?? null,
      notes: data.notes ?? null,
      registeredBy: 'local',
      createdAt: new Date().toISOString(),
    };
  }
}

export const customerDebtRepository = new CustomerDebtRepository();
