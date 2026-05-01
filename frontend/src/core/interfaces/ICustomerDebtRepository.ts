import type { CustomerDebt, UpdateDebtData } from '@/core/entities/customer-debt';
import type { DebtPayment, RegisterDebtPaymentData } from '@/core/entities/debt-payment';

export interface ICustomerDebtRepository {
  findAll(status?: string): Promise<CustomerDebt[]>;
  findOverdue(): Promise<CustomerDebt[]>;
  findById(id: string): Promise<CustomerDebt | null>;
  findByCustomer(customerId: string): Promise<CustomerDebt[]>;
  update(id: string, data: UpdateDebtData): Promise<CustomerDebt>;
  cancel(id: string): Promise<CustomerDebt>;
  registerPayment(debtId: string, data: RegisterDebtPaymentData): Promise<DebtPayment>;
}
