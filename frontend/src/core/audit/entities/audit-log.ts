export interface AuditLogEntry {
  id: string;
  actorName: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeData?: string;
  afterData?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogFilter {
  entityType?: string;
  actorId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  size: number;
}
