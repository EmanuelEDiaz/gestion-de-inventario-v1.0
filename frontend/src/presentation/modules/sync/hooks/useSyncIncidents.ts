import { useQuery } from '@tanstack/react-query';
import type { SyncIncidentStatus } from '@/core/settings/entities/sync-incident';
import { SyncIncidentRepository } from '@/infrastructure/repositories/settings/SyncIncidentRepository';

const repo = new SyncIncidentRepository();

export function useSyncIncidents(deviceId?: string) {
  return useQuery({
    queryKey: ['sync-incidents', deviceId ?? 'all'],
    queryFn: () => repo.findPending(deviceId),
  });
}

export function useSyncIncidentDetail(id: string) {
  return useQuery({
    queryKey: ['sync-incident', id],
    queryFn: () => repo.findById(id),
    enabled: !!id,
  });
}

// Re-export status type for use in components
export type { SyncIncidentStatus };
