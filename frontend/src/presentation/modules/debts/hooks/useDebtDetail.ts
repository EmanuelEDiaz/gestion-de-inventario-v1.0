import { useQuery } from '@tanstack/react-query';
import { CustomerDebtRepository } from '@/infrastructure/repositories/CustomerDebtRepository';

const repo = new CustomerDebtRepository();

export function useDebtDetail(id: string) {
  return useQuery({
    queryKey: ['debt', id],
    queryFn: () => repo.findById(id),
    enabled: !!id,
  });
}
