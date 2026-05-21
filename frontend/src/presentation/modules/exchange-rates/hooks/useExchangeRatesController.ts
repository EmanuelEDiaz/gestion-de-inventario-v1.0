'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangeRateRepository } from '@/infrastructure/repositories/exchange-rate/ExchangeRateRepository';
import {
  GetExchangeRatesUseCase,
  CreateExchangeRateUseCase,
} from '@/core/exchange-rate/use-cases';
import type { CreateExchangeRateInput, ExchangeRateFilter } from '@/core/exchange-rate/entities/exchange-rate';
import { toast } from 'sonner';

const getRates = new GetExchangeRatesUseCase(exchangeRateRepository);
const createRate = new CreateExchangeRateUseCase(exchangeRateRepository);

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

  return {
    rates: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
