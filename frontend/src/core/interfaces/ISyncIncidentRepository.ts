import type { SyncIncident, ReportSyncIncidentData, ResolveSyncIncidentData } from '@/core/entities/sync-incident';

export interface ISyncIncidentRepository {
  findPending(deviceId?: string): Promise<SyncIncident[]>;
  findById(id: string): Promise<SyncIncident | null>;
  report(data: ReportSyncIncidentData): Promise<SyncIncident>;
  resolve(id: string, data: ResolveSyncIncidentData): Promise<SyncIncident>;
  ignore(id: string): Promise<SyncIncident>;
}
