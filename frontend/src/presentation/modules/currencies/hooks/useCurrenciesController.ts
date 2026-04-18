'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currencyRepository } from '@/infrastructure/repositories/CurrencyRepository';
import {
  GetCurrenciesUseCase,
  CreateCurrencyUseCase,
  UpdateCurrencyUseCase,
} from '@/core/use-cases/currency';
import type { CreateCurrencyInput, UpdateCurrencyInput } from '@/core/entities/currency';
import { toast } from 'sonner';

const getCurrencies = new GetCurrenciesUseCase(currencyRepository);
const createCurrency = new CreateCurrencyUseCase(currencyRepository);
const updateCurrency = new UpdateCurrencyUseCase(currencyRepository);

export function useCurrenciesController() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['currencies'],
    queryFn: () => getCurrencies.execute(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCurrencyInput) => createCurrency.execute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Moneda creada');
    },
    onError: (error: Error) => toast.error(error.message || 'Error al crear moneda'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ code, data }: { code: string; data: UpdateCurrencyInput }) =>
      updateCurrency.execute(code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Moneda actualizada');
    },
    onError: (error: Error) => toast.error(error.message || 'Error al actualizar moneda'),
  });

  return {
    currencies: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
