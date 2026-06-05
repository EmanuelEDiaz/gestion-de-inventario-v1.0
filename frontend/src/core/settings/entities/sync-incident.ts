/**
 * Valores verificados en tests del backend.
 * ⚠️ No usar 'CONFLICT' a secas — produce HTTP 400.
 */
export type SyncIncidentType =
  | 'STOCK_CONFLICT'
  | 'ENTITY_DUPLICATE'
  | 'VERSION_MISMATCH'
  | 'CHECKSUM_ERROR';

export type SyncIncidentStatus = 'PENDING' | 'RESOLVED' | 'IGNORED';

export interface SyncIncident {
  id: string;
  deviceId: string;
  operationId: string;
  entityType: string;
  entityId: string;
  incidentType: SyncIncidentType;
  status: SyncIncidentStatus;
  myPayload: string | null;
  serverPayload: string | null;
  resolution: string | null;
  userId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  errorCode?: string;
  error?: string;
}

export interface ReportSyncIncidentData {
  deviceId: string;
  operationId: string;
  entityType: string;
  entityId: string;
  incidentType: SyncIncidentType;
  myPayload?: string;
  serverPayload?: string;
}

export type ResolutionAction = 'use-server' | 'use-client' | 'merge' | 'delete-local';

export interface ResolveSyncIncidentData {
  resolution: ResolutionAction | string;
  payload?: Record<string, unknown>;
}

export const SYNC_INCIDENT_TYPE_LABELS: Record<SyncIncidentType, string> = {
  STOCK_CONFLICT: 'Conflicto de stock',
  ENTITY_DUPLICATE: 'Entidad duplicada',
  VERSION_MISMATCH: 'Versión desactualizada',
  CHECKSUM_ERROR: 'Error de checksum',
};

export const SYNC_INCIDENT_STATUS_LABELS: Record<SyncIncidentStatus, string> = {
  PENDING: 'Pendiente',
  RESOLVED: 'Resuelto',
  IGNORED: 'Ignorado',
};
