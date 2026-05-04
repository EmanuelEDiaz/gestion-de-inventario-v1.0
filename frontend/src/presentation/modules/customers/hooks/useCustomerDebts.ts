'use client';

import { useQuery } from '@tanstack/react-query';
import { customerDebtApi } from '@/infrastructure/api/customer-debt-api';

export function useCustomerDebts(customerId: string) {
  const { data: debts = [], isLoading, error } = useQuery({
    queryKey: ['customer-debts', customerId],
    queryFn: () => customerDebtApi.getByCustomer(customerId),
    enabled: !!customerId,
  });

  return { debts, isLoading, error };
}
