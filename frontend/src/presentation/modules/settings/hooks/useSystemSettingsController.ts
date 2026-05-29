'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemSettingsRepository } from '@/infrastructure/repositories/system-settings/SystemSettingsRepository';
import type { UpdateSystemSettingInput } from '@/core/system-settings/entities/system-setting';
import { toast } from '@/presentation/shared/components/ui/toast';

export function useSystemSettingsController() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => systemSettingsRepository.list(),
    retry: 1,
    retryDelay: 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ key, input }: { key: string; input: UpdateSystemSettingInput }) =>
      systemSettingsRepository.update(key, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Configuración actualizada', {
        description: 'El cambio se aplicará en los próximos minutos.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al guardar', {
        description: error.message,
      });
    },
  });

  return {
    settings: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    update: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
