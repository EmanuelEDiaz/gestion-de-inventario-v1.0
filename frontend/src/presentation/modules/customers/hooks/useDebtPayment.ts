'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerDebtApi } from '@/infrastructure/api/customer-debt-api';
import type { RegisterDebtPaymentData } from '@/core/entities/debt-payment';

export function useDebtPayment(customerId: string, _debtId?: string) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: RegisterDebtPaymentData }) =>
      customerDebtApi.registerPayment(debtId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['customer-debts', customerId] }),
  });

  return {
    ...mutation,
    registerPayment: mutation.mutate,
  };
}
