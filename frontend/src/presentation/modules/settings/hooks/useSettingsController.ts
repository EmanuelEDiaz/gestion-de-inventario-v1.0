'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsRepository } from '@/infrastructure/repositories/SettingsRepository';
import { GetSettingsUseCase, UpdateSettingsUseCase } from '@/core/use-cases/settings';
import type { AppSettings, UpdateSettingsInput } from '@/core/entities/app-settings';
import { toast } from 'sonner';

const getSettings = new GetSettingsUseCase(settingsRepository);
const updateSettings = new UpdateSettingsUseCase(settingsRepository);

const DEFAULT_SETTINGS: AppSettings = {
  defaultCostMethod: 'STANDARD',
  defaultCurrencyCode: 'CUP',
  companyName: null,
  lowStockThresholdDefault: null,
  maxProductPages: 20,
  searchDebounceMs: 300,
  version: 0,
};

export function useSettingsController() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings.execute(),
    retry: 1,
    retryDelay: 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ data, version }: { data: UpdateSettingsInput; version: number }) =>
      updateSettings.execute(data, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configuración actualizada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar configuración');
    },
  });

  return {
    settings: query.data ?? DEFAULT_SETTINGS,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    update: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    isError: query.isError,
  };
}
