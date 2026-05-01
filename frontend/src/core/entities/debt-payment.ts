import type { DebtPaymentMethod } from './customer-debt';

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentMethod: DebtPaymentMethod | null;
  notes: string | null;
  registeredBy: string;
  createdAt: string;
}

export interface RegisterDebtPaymentData {
  amount: number;
  paymentMethod?: DebtPaymentMethod;
  notes?: string;
}
