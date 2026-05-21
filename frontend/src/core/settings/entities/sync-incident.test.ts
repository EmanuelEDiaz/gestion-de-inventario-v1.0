import { describe, it, expect } from 'vitest';
import type { SyncIncident, SyncIncidentType, SyncIncidentStatus, ReportSyncIncidentData, ResolveSyncIncidentData } from './sync-incident';
import { SYNC_INCIDENT_TYPE_LABELS, SYNC_INCIDENT_STATUS_LABELS } from './sync-incident';

describe('SyncIncident Entity', () => {
  const mockIncident: SyncIncident = {
    id: 'inc-1',
    deviceId: 'device-abc',
    operationId: 'op-uuid-123',
    entityType: 'Product',
    entityId: 'prod-1',
    incidentType: 'STOCK_CONFLICT',
    status: 'PENDING',
    myPayload: '{"quantity":10}',
    serverPayload: '{"quantity":5}',
    resolution: null,
    userId: null,
    createdAt: '2026-01-01T00:00:00Z',
    resolvedAt: null,
  };

  it('should create a valid SyncIncident', () => {
    // Assert
    expect(mockIncident.id).toBe('inc-1');
    expect(mockIncident.incidentType).toBe('STOCK_CONFLICT');
    expect(mockIncident.status).toBe('PENDING');
  });

  it('should validate all SyncIncidentType values — verificados en backend', () => {
    // Arrange
    const validTypes: SyncIncidentType[] = [
      'STOCK_CONFLICT',
      'ENTITY_DUPLICATE',
      'VERSION_MISMATCH',
      'CHECKSUM_ERROR',
    ];

    // Assert — 'CONFLICT' a secas no existe
    expect(validTypes).toContain(mockIncident.incidentType);
    expect(validTypes).not.toContain('CONFLICT');
  });

  it('should validate all SyncIncidentStatus values', () => {
    // Arrange
    const validStatuses: SyncIncidentStatus[] = ['PENDING', 'RESOLVED', 'IGNORED'];

    // Assert
    expect(validStatuses).toContain(mockIncident.status);
  });

  it('should allow null on nullable fields when pending', () => {
    // Assert
    expect(mockIncident.resolution).toBeNull();
    expect(mockIncident.resolvedAt).toBeNull();
    expect(mockIncident.userId).toBeNull();
  });

  it('should support resolved state with resolution text', () => {
    // Arrange
    const resolvedIncident: SyncIncident = {
      ...mockIncident,
      status: 'RESOLVED',
      resolution: 'Se aplicó versión del servidor',
      resolvedAt: '2026-01-02T00:00:00Z',
    };

    // Assert
    expect(resolvedIncident.status).toBe('RESOLVED');
    expect(resolvedIncident.resolution).toBeTruthy();
    expect(resolvedIncident.resolvedAt).not.toBeNull();
  });
});

describe('SYNC_INCIDENT_TYPE_LABELS', () => {
  it('should have a Spanish label for every incident type', () => {
    // Arrange
    const types: SyncIncidentType[] = [
      'STOCK_CONFLICT',
      'ENTITY_DUPLICATE',
      'VERSION_MISMATCH',
      'CHECKSUM_ERROR',
    ];

    // Assert
    types.forEach((type) => {
      expect(SYNC_INCIDENT_TYPE_LABELS[type]).toBeTruthy();
    });
  });
});

describe('SYNC_INCIDENT_STATUS_LABELS', () => {
  it('should have a Spanish label for every status', () => {
    // Arrange
    const statuses: SyncIncidentStatus[] = ['PENDING', 'RESOLVED', 'IGNORED'];

    // Assert
    statuses.forEach((status) => {
      expect(SYNC_INCIDENT_STATUS_LABELS[status]).toBeTruthy();
    });
  });
});

describe('ReportSyncIncidentData', () => {
  it('should accept required fields and optional payloads', () => {
    // Arrange
    const reportData: ReportSyncIncidentData = {
      deviceId: 'device-abc',
      operationId: 'op-uuid-456',
      entityType: 'Sale',
      entityId: 'sale-1',
      incidentType: 'VERSION_MISMATCH',
      myPayload: '{"version":3}',
    };

    // Assert
    expect(reportData.incidentType).toBe('VERSION_MISMATCH');
    expect(reportData.serverPayload).toBeUndefined();
  });
});

describe('ResolveSyncIncidentData', () => {
  it('should require resolution text', () => {
    // Arrange
    const resolveData: ResolveSyncIncidentData = {
      resolution: 'Confirmado con el usuario: mantener versión local',
    };

    // Assert
    expect(resolveData.resolution).toBeTruthy();
  });
});
