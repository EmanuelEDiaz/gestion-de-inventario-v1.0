import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerDebtRepository } from '@/infrastructure/repositories/CustomerDebtRepository';
import type { UpdateDebtData } from '@/core/entities/customer-debt';
import { toast } from '@/presentation/shared/components/ui/toast';

const repo = new CustomerDebtRepository();

export function useUpdateDebt(debtId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDebtData) => repo.update(debtId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      qc.invalidateQueries({ queryKey: ['debt', debtId] });
      toast.success('Deuda actualizada correctamente');
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Error al actualizar la deuda');
    },
  });
}

export function useCancelDebt(debtId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => repo.cancel(debtId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      qc.invalidateQueries({ queryKey: ['debt', debtId] });
      toast.success('Deuda cancelada');
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Error al cancelar la deuda');
    },
  });
}
