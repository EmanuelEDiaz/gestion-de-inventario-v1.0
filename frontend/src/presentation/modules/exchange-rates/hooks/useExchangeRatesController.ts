'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangeRateRepository } from '@/infrastructure/repositories/exchange-rate/ExchangeRateRepository';
import {
  GetExchangeRatesUseCase,
  CreateExchangeRateUseCase,
  UpdateExchangeRateUseCase,
  DeleteExchangeRateUseCase,
} from '@/core/exchange-rate/use-cases';
import type { CreateExchangeRateInput, UpdateExchangeRateInput, ExchangeRateFilter } from '@/core/exchange-rate/entities/exchange-rate';
import { toast } from '@/presentation/shared/components/ui/toast';

const getRates = new GetExchangeRatesUseCase(exchangeRateRepository);
const createRate = new CreateExchangeRateUseCase(exchangeRateRepository);
const updateRate = new UpdateExchangeRateUseCase(exchangeRateRepository);
const deleteRate = new DeleteExchangeRateUseCase(exchangeRateRepository);

export function useExchangeRatesController(filter?: ExchangeRateFilter) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['exchange-rates', filter],
    queryFn: () => getRates.execute(filter),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateExchangeRateInput) => createRate.execute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Tasa de cambio creada');
    },
    onError: (error: Error) => toast.error(error.message || 'Error al crear tasa'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExchangeRateInput }) =>
      updateRate.execute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Tasa de cambio actualizada');
    },
    onError: (error: Error) => toast.error(error.message || 'Error al actualizar tasa'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRate.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Tasa de cambio eliminada');
    },
    onError: (error: Error) => toast.error(error.message || 'Error al eliminar tasa'),
  });

  const deleteManyMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => deleteRate.execute(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Tasas de cambio eliminadas');
    },
    onError: (error: Error) => toast.error(error.message || 'Error al eliminar tasas'),
  });

  return {
    rates: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    remove: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    removeMany: deleteManyMutation.mutateAsync,
    isDeletingMany: deleteManyMutation.isPending,
  };
}
