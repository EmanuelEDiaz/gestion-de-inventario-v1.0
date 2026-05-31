'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currencyRepository } from '@/infrastructure/repositories/currency/CurrencyRepository';
import {
  GetCurrenciesUseCase,
  CreateCurrencyUseCase,
  UpdateCurrencyUseCase,
  DeleteCurrencyUseCase,
} from '@/core/currency/use-cases';
import type { CreateCurrencyInput, UpdateCurrencyInput } from '@/core/currency/entities/currency';
import { toast } from '@/presentation/shared/components/ui/toast';

const getCurrencies = new GetCurrenciesUseCase(currencyRepository);
const createCurrency = new CreateCurrencyUseCase(currencyRepository);
const updateCurrency = new UpdateCurrencyUseCase(currencyRepository);
const deleteCurrency = new DeleteCurrencyUseCase(currencyRepository);

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

  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteCurrency.execute(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Moneda eliminada');
    },
    onError: (error: Error) => toast.error(error.message || 'Error al eliminar moneda'),
  });

  const bulkDisable = useCallback(async (codes: string[]) => {
    try {
      await Promise.all(codes.map(code => updateCurrency.execute(code, { isActive: false })));
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success(`${codes.length} moneda(s) desactivada(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al desactivar monedas');
    }
  }, []);

  const bulkEnable = useCallback(async (codes: string[]) => {
    try {
      await Promise.all(codes.map(code => updateCurrency.execute(code, { isActive: true })));
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success(`${codes.length} moneda(s) activada(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al activar monedas');
    }
  }, []);

  const removeMany = useCallback(async (codes: string[]) => {
    try {
      await Promise.all(codes.map(code => deleteCurrency.execute(code)));
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success(`${codes.length} moneda(s) eliminada(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar monedas');
    }
  }, []);

  return {
    currencies: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    removeMany,
    bulkDisable,
    bulkEnable,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
