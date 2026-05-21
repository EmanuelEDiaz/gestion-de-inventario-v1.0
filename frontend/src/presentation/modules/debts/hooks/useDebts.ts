import { useQuery } from '@tanstack/react-query';
import { CustomerDebtRepository } from '@/infrastructure/repositories/customer/CustomerDebtRepository';
import type { DebtStatus } from '@/core/customer/entities/customer-debt';

const repo = new CustomerDebtRepository();

export function useDebts(status?: DebtStatus) {
  return useQuery({
    queryKey: ['debts', status ?? 'all'],
    queryFn: () => repo.findAll(status),
  });
}

export function useOverdueDebts() {
  return useQuery({
    queryKey: ['debts', 'overdue'],
    queryFn: () => repo.findOverdue(),
  });
}
