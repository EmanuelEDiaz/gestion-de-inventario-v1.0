import type { AuditLogEntry, AuditLogFilter } from '../entities/audit-log';

export interface IAuditLogRepository {
  list(filter: AuditLogFilter): Promise<{ items: AuditLogEntry[]; total: number }>;
  getById(id: string): Promise<AuditLogEntry>;
  getByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]>;
}
