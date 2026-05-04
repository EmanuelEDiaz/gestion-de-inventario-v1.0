'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { importRepository } from '@/infrastructure/repositories/ImportRepository';
import { toast } from 'sonner';

export function useImportController() {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ file, mapping }: { file: File; mapping: Record<string, string> }) =>
      importRepository.uploadCsv(file, mapping),
    onSuccess: () => {
      toast.success('Importación iniciada');
      queryClient.invalidateQueries({ queryKey: ['import'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const dryRunMutation = useMutation({
    mutationFn: ({ file, mapping }: { file: File; mapping: Record<string, string> }) =>
      importRepository.dryRun(file, mapping),
    onSuccess: () => toast.success('Simulación completada'),
    onError: (err: Error) => toast.error(err.message),
  });

  const useJobStatus = (id: string | null) =>
    useQuery({
      queryKey: ['import', id, 'status'],
      queryFn: () => importRepository.getStatus(id!),
      enabled: !!id,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === 'PENDING' || status === 'PROCESSING' ? 2000 : false;
      },
    });

  return { uploadMutation, dryRunMutation, useJobStatus };
}
