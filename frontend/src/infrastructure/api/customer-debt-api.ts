import { apiClient } from './client';
import type { CustomerDebt, UpdateDebtData } from '@/core/entities/customer-debt';
import type { DebtPayment, RegisterDebtPaymentData } from '@/core/entities/debt-payment';

const BASE = '/api/v1/debts';

export const customerDebtApi = {
  getAll(status?: string): Promise<CustomerDebt[]> {
    const params = status ? `?status=${status}` : '';
    return apiClient.get<CustomerDebt[]>(`${BASE}${params}`).then((r) => r.data);
  },

  getOverdue(): Promise<CustomerDebt[]> {
    return apiClient.get<CustomerDebt[]>(`${BASE}/overdue`).then((r) => r.data);
  },

  getById(id: string): Promise<CustomerDebt> {
    return apiClient.get<CustomerDebt>(`${BASE}/${id}`).then((r) => r.data);
  },

  getByCustomer(customerId: string): Promise<CustomerDebt[]> {
    return apiClient
      .get<CustomerDebt[]>(`${BASE}/customer/${customerId}`)
      .then((r) => r.data);
  },

  update(id: string, data: UpdateDebtData): Promise<CustomerDebt> {
    return apiClient.patch<CustomerDebt>(`${BASE}/${id}`, data).then((r) => r.data);
  },

  cancel(id: string): Promise<CustomerDebt> {
    return apiClient.post<CustomerDebt>(`${BASE}/${id}/cancel`).then((r) => r.data);
  },

  registerPayment(debtId: string, data: RegisterDebtPaymentData): Promise<DebtPayment> {
    return apiClient
      .post<DebtPayment>(`${BASE}/${debtId}/payments`, data)
      .then((r) => r.data);
  },
};
