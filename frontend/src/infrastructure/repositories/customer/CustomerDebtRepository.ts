import { apiClient } from '@/infrastructure/api/client';
import type { ICustomerDebtRepository } from '@/core/customer/ports/ICustomerDebtRepository';
import type { CustomerDebt, UpdateDebtData } from '@/core/customer/entities/customer-debt';
import type { DebtPayment, RegisterDebtPaymentData } from '@/core/customer/entities/debt-payment';
import { getDB, safeCacheWrite } from '@/infrastructure/storage/db';
import { tryApiOrOutbox } from '@/infrastructure/repositories/shared/api-or-outbox';

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
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.patch<CustomerDebt>(`${this.basePath}/${id}`, data);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.put('customerDebts', { ...response.data, cachedAt: Date.now() } as any);
        }, 'CustomerDebtRepository.update');
        return response.data;
      },
      { entityType: 'DEBT', entityId: id, action: 'UPDATE', payload: data },
    );
  }

  async cancel(id: string): Promise<CustomerDebt> {
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.post<CustomerDebt>(`${this.basePath}/${id}/cancel`);
        await safeCacheWrite(async () => {
          const db = await getDB();
          await db.put('customerDebts', { ...response.data, cachedAt: Date.now() } as any);
        }, 'CustomerDebtRepository.cancel');
        return response.data;
      },
      { entityType: 'DEBT', entityId: id, action: 'CANCEL', payload: {} },
    );
  }

  async registerPayment(debtId: string, data: RegisterDebtPaymentData): Promise<DebtPayment> {
    return tryApiOrOutbox(
      async () => {
        const response = await apiClient.post<DebtPayment>(`${this.basePath}/${debtId}/payments`, data);
        return response.data;
      },
      { entityType: 'DEBT_PAYMENT', entityId: debtId, action: 'REGISTER_PAYMENT', payload: data },
    );
  }
}

export const customerDebtRepository = new CustomerDebtRepository();
