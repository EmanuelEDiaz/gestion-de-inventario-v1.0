'use client';

import { useQuery } from '@tanstack/react-query';
import { customerDebtRepository } from '@/infrastructure/repositories/customer/CustomerDebtRepository';

export function useCustomerDebts(customerId: string) {
  const { data: debts = [], isLoading, error } = useQuery({
    queryKey: ['customer-debts', customerId],
    queryFn: () => customerDebtRepository.findByCustomer(customerId),
    enabled: !!customerId,
  });

  return { debts, isLoading, error };
}
