import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResolveSyncIncidentData } from '@/core/entities/sync-incident';
import { SyncIncidentRepository } from '@/infrastructure/repositories/SyncIncidentRepository';
import { toast } from '@/presentation/shared/components/ui/toast';

const repo = new SyncIncidentRepository();

export function useResolveSyncIncident(incidentId: string) {
  const qc = useQueryClient();

  const resolve = useMutation({
    mutationFn: (data: ResolveSyncIncidentData) => repo.resolve(incidentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sync-incidents'] });
      qc.invalidateQueries({ queryKey: ['sync-incident', incidentId] });
      toast.success('Incidente resuelto correctamente');
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Error al resolver el incidente');
    },
  });

  const ignore = useMutation({
    mutationFn: () => repo.ignore(incidentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sync-incidents'] });
      toast.success('Incidente ignorado');
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Error al ignorar el incidente');
    },
  });

  return { resolve, ignore };
}
