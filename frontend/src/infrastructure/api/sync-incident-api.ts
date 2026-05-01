import { apiClient } from './client';
import type { SyncIncident, ReportSyncIncidentData, ResolveSyncIncidentData } from '@/core/entities/sync-incident';

const BASE = '/api/v1/sync/incidents';

export const syncIncidentApi = {
  getPending(deviceId?: string): Promise<SyncIncident[]> {
    const params = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
    return apiClient.get<SyncIncident[]>(`${BASE}${params}`).then((r) => r.data);
  },

  getById(id: string): Promise<SyncIncident> {
    return apiClient.get<SyncIncident>(`${BASE}/${id}`).then((r) => r.data);
  },

  report(data: ReportSyncIncidentData): Promise<SyncIncident> {
    return apiClient.post<SyncIncident>(BASE, data).then((r) => r.data);
  },

  resolve(id: string, data: ResolveSyncIncidentData): Promise<SyncIncident> {
    return apiClient.post<SyncIncident>(`${BASE}/${id}/resolve`, data).then((r) => r.data);
  },

  ignore(id: string): Promise<SyncIncident> {
    return apiClient.post<SyncIncident>(`${BASE}/${id}/ignore`).then((r) => r.data);
  },
};
