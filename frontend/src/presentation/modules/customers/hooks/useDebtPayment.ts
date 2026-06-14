'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerDebtRepository } from '@/infrastructure/repositories/customer/CustomerDebtRepository';
import type { RegisterDebtPaymentData } from '@/core/customer/entities/debt-payment';

export function useDebtPayment(customerId: string, _debtId?: string) {
  void _debtId;
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: RegisterDebtPaymentData }) =>
      customerDebtRepository.registerPayment(debtId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-debts', customerId] });
      qc.invalidateQueries({ queryKey: ['debts'] });
    },
  });

  return {
    ...mutation,
    registerPayment: mutation.mutate,
  };
}
