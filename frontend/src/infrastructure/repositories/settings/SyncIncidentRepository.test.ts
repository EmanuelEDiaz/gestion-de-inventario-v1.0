import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncIncidentRepository } from './SyncIncidentRepository';
import { syncIncidentApi } from '@/infrastructure/api/sync-incident-api';
import type { SyncIncident } from '@/core/settings/entities/sync-incident';

vi.mock('@/infrastructure/api/sync-incident-api', () => ({
  syncIncidentApi: {
    getPending: vi.fn(),
    getById: vi.fn(),
    report: vi.fn(),
    resolve: vi.fn(),
    ignore: vi.fn(),
  },
}));

const mockIncident: SyncIncident = {
  id: 'inc-1',
  deviceId: 'device-abc',
  operationId: 'op-uuid-1',
  entityType: 'Product',
  entityId: 'prod-1',
  incidentType: 'STOCK_CONFLICT',
  status: 'PENDING',
  myPayload: null,
  serverPayload: null,
  resolution: null,
  userId: null,
  createdAt: '2026-01-01T00:00:00Z',
  resolvedAt: null,
};

describe('SyncIncidentRepository', () => {
  let repo: SyncIncidentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new SyncIncidentRepository();
  });

  it('findPending — calls api without deviceId', async () => {
    // Arrange
    vi.mocked(syncIncidentApi.getPending).mockResolvedValue([mockIncident]);

    // Act
    const result = await repo.findPending();

    // Assert
    expect(syncIncidentApi.getPending).toHaveBeenCalledWith(undefined);
    expect(result).toHaveLength(1);
  });

  it('findPending — passes deviceId filter', async () => {
    // Arrange
    vi.mocked(syncIncidentApi.getPending).mockResolvedValue([mockIncident]);

    // Act
    await repo.findPending('device-abc');

    // Assert
    expect(syncIncidentApi.getPending).toHaveBeenCalledWith('device-abc');
  });

  it('findById — returns incident', async () => {
    // Arrange
    vi.mocked(syncIncidentApi.getById).mockResolvedValue(mockIncident);

    // Act
    const result = await repo.findById('inc-1');

    // Assert
    expect(result?.id).toBe('inc-1');
  });

  it('findById — returns null on error', async () => {
    // Arrange
    vi.mocked(syncIncidentApi.getById).mockRejectedValue(new Error('404'));

    // Act
    const result = await repo.findById('nonexistent');

    // Assert
    expect(result).toBeNull();
  });

  it('report — delegates to api', async () => {
    // Arrange
    vi.mocked(syncIncidentApi.report).mockResolvedValue(mockIncident);

    // Act
    const result = await repo.report({
      deviceId: 'device-abc',
      operationId: 'op-uuid-1',
      entityType: 'Product',
      entityId: 'prod-1',
      incidentType: 'STOCK_CONFLICT',
    });

    // Assert
    expect(syncIncidentApi.report).toHaveBeenCalled();
    expect(result.incidentType).toBe('STOCK_CONFLICT');
  });

  it('resolve — returns resolved incident', async () => {
    // Arrange
    const resolved = { ...mockIncident, status: 'RESOLVED' as const, resolvedAt: '2026-01-02T00:00:00Z' };
    vi.mocked(syncIncidentApi.resolve).mockResolvedValue(resolved);

    // Act
    const result = await repo.resolve('inc-1', { resolution: 'Aceptar versión del servidor' });

    // Assert
    expect(result.status).toBe('RESOLVED');
    expect(result.resolvedAt).not.toBeNull();
  });

  it('ignore — returns ignored incident', async () => {
    // Arrange
    const ignored = { ...mockIncident, status: 'IGNORED' as const };
    vi.mocked(syncIncidentApi.ignore).mockResolvedValue(ignored);

    // Act
    const result = await repo.ignore('inc-1');

    // Assert
    expect(result.status).toBe('IGNORED');
  });
});
