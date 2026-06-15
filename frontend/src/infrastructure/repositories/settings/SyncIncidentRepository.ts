import type { ISyncIncidentRepository } from '@/core/settings/ports/ISyncIncidentRepository';
import type { SyncIncident, ReportSyncIncidentData, ResolveSyncIncidentData } from '@/core/settings/entities/sync-incident';
import { syncIncidentApi } from '@/infrastructure/api/sync-incident-api';

export class SyncIncidentRepository implements ISyncIncidentRepository {
  async findPending(deviceId?: string): Promise<SyncIncident[]> {
    return syncIncidentApi.getPending(deviceId);
  }

  async findById(id: string): Promise<SyncIncident | null> {
    try {
      return await syncIncidentApi.getById(id);
    } catch {
      // Offline fallback: incident not found or network unavailable
      return null;
    }
  }

  async report(data: ReportSyncIncidentData): Promise<SyncIncident> {
    return syncIncidentApi.report(data);
  }

  async resolve(id: string, data: ResolveSyncIncidentData): Promise<SyncIncident> {
    return syncIncidentApi.resolve(id, data);
  }

  async ignore(id: string): Promise<SyncIncident> {
    return syncIncidentApi.ignore(id);
  }
}
