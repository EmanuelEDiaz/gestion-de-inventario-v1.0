import type { ICustomerDebtRepository } from '@/core/interfaces/ICustomerDebtRepository';
import type { CustomerDebt, UpdateDebtData } from '@/core/entities/customer-debt';
import type { DebtPayment, RegisterDebtPaymentData } from '@/core/entities/debt-payment';
import { customerDebtApi } from '@/infrastructure/api/customer-debt-api';

export class CustomerDebtRepository implements ICustomerDebtRepository {
  async findAll(status?: string): Promise<CustomerDebt[]> {
    return customerDebtApi.getAll(status);
  }

  async findOverdue(): Promise<CustomerDebt[]> {
    return customerDebtApi.getOverdue();
  }

  async findById(id: string): Promise<CustomerDebt | null> {
    try {
      return await customerDebtApi.getById(id);
    } catch {
      return null;
    }
  }

  async findByCustomer(customerId: string): Promise<CustomerDebt[]> {
    return customerDebtApi.getByCustomer(customerId);
  }

  async update(id: string, data: UpdateDebtData): Promise<CustomerDebt> {
    return customerDebtApi.update(id, data);
  }

  async cancel(id: string): Promise<CustomerDebt> {
    return customerDebtApi.cancel(id);
  }

  async registerPayment(debtId: string, data: RegisterDebtPaymentData): Promise<DebtPayment> {
    return customerDebtApi.registerPayment(debtId, data);
  }
}
