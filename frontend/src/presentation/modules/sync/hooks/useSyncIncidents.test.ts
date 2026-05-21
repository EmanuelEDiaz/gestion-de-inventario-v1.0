import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { useSyncIncidents, useSyncIncidentDetail } from './useSyncIncidents';

vi.mock('@/infrastructure/repositories/settings/SyncIncidentRepository', () => ({
  SyncIncidentRepository: class {
    findPending = vi.fn().mockResolvedValue([]);
    findById = vi.fn().mockResolvedValue(null);
  },
}));

const mockUseQuery = vi.mocked(useQuery);

describe('useSyncIncidents', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQuery>);
  });

  it('debería tener queryKey ["sync-incidents", "all"] sin deviceId', () => {
    useSyncIncidents();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['sync-incidents', 'all'] })
    );
  });

  it('debería tener queryKey con deviceId cuando se proporciona', () => {
    useSyncIncidents('device-123');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['sync-incidents', 'device-123'] })
    );
  });

  it('debería tener enabled: false cuando id está vacío en useSyncIncidentDetail', () => {
    useSyncIncidentDetail('');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['sync-incident', ''],
        enabled: false,
      })
    );
  });

  it('debería tener enabled: true cuando id está presente en useSyncIncidentDetail', () => {
    useSyncIncidentDetail('incident-abc');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['sync-incident', 'incident-abc'],
        enabled: true,
      })
    );
  });
});
