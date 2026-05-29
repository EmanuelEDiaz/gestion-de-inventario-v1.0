import { apiClient } from '@/infrastructure/api/client';
import type { IAuditLogRepository } from '@/core/audit/ports/IAuditLogRepository';
import type { AuditLogEntry, AuditLogFilter } from '@/core/audit/entities/audit-log';

export class AuditLogRepository implements IAuditLogRepository {
  private basePath = '/api/v1/audit-logs';

  async list(filter: AuditLogFilter): Promise<{ items: AuditLogEntry[]; total: number }> {
    const response = await apiClient.get<AuditLogEntry[]>(this.basePath, { params: filter });
    const total = parseInt(response.headers['x-total-count'] || String(response.data.length), 10);
    return { items: response.data, total };
  }

  async getById(id: string): Promise<AuditLogEntry> {
    const response = await apiClient.get<AuditLogEntry>(`${this.basePath}/${id}`);
    return response.data;
  }

  async getByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    const response = await apiClient.get<AuditLogEntry[]>(`${this.basePath}/entity/${entityType}/${entityId}`);
    return response.data;
  }
}

export const auditLogRepository = new AuditLogRepository();
