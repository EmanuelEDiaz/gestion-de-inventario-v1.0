import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';

vi.mock('@/infrastructure/storage/db', () => ({
  getCachedCount: vi.fn(),
  getOutboxCount: vi.fn(),
  checkStorageQuota: vi.fn(),
  requestPersistentStorage: vi.fn(),
  getSyncMeta: vi.fn(),
  getDB: vi.fn(),
  DB_NAME: 'inventory-offline',
  DB_VERSION: 6,
}));

vi.mock('@/infrastructure/maps/opfs-utils', () => ({
  getMapMeta: vi.fn(),
}));

vi.mock('@/infrastructure/storage/networkStore', () => ({
  useNetworkStore: Object.assign(
    (selector: (s: { mode: string }) => unknown) => selector({ mode: 'online-direct' }),
    {
      getState: () => ({ mode: 'online-direct', setMode: vi.fn() }),
    },
  ),
  getNetworkMode: () => 'online-direct',
}));

vi.mock('@/infrastructure/logging/appLogger', () => ({
  appLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    getLogs: vi.fn(() => []),
    clearLogs: vi.fn(),
    flush: vi.fn(),
  },
}));

vi.mock('@/presentation/shared/hooks/storage/useAuthStore', () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean; user: unknown }) => unknown) =>
    selector({ isAuthenticated: true, user: { id: 'u1', displayName: 'Admin', username: 'admin' } }),
}));

const syncMock = vi.fn();
vi.mock('@/presentation/shared/hooks/storage/useSyncStatus', () => ({
  useSyncStatus: () => ({
    status: 'online',
    pendingCount: 0,
    lastSyncAt: 1700000000000,
    sync: syncMock,
    isOffline: false,
    isOnline: true,
    isSyncing: false,
    error: null,
  }),
}));

import { getCachedCount, getOutboxCount, checkStorageQuota, requestPersistentStorage, getSyncMeta, getDB } from '@/infrastructure/storage/db';
import { getMapMeta } from '@/infrastructure/maps/opfs-utils';
import { HealthPanel } from './HealthPanel';

function setQuotaMock(percent: number, persistent: boolean, usage = 1_000_000, quota = 100_000_000) {
  vi.mocked(checkStorageQuota).mockResolvedValue({ usage, quota, percentUsed: percent });
  vi.mocked(requestPersistentStorage).mockResolvedValue(persistent);
}

function setStoreCounts(counts: Record<string, number>) {
  vi.mocked(getCachedCount).mockImplementation(async (store: string) => counts[store] ?? 0);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDB).mockResolvedValue({} as never);
  vi.mocked(getOutboxCount).mockResolvedValue(0);
  vi.mocked(getSyncMeta).mockResolvedValue(null);
  setStoreCounts({ products: 12, warehouses: 2, outbox: 0 });
  setQuotaMock(2, true);
  vi.mocked(getMapMeta).mockResolvedValue(null);
});

describe('HealthPanel', () => {
  it('renders the title and summary banner with availability badge', async () => {
    render(<HealthPanel />);

    expect(screen.getByRole('heading', { name: /Panel de salud/i })).toBeInTheDocument();
    expect(screen.getByText(/Diagnóstico local. Solo lectura/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('data-loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('health-summary')).toBeInTheDocument();
  });

  it('shows IDB store counts for tracked stores', async () => {
    setStoreCounts({ products: 42, warehouses: 3, categories: 7, outbox: 5 });
    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByTestId('idb-count-products')).toHaveTextContent('42');
    });
    expect(screen.getByTestId('idb-count-warehouses')).toHaveTextContent('3');
    expect(screen.getByTestId('idb-count-categories')).toHaveTextContent('7');
    expect(screen.getByTestId('idb-count-outbox')).toHaveTextContent('5');
    expect(screen.getByTestId('idb-name')).toHaveTextContent('inventory-offline');
    expect(screen.getByTestId('idb-version')).toHaveTextContent('6');
  });

  it('renders all 7 collapsible sections', async () => {
    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.queryByTestId('data-loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('section-cuota')).toBeInTheDocument();
    expect(screen.getByTestId('section-idb')).toBeInTheDocument();
    expect(screen.getByTestId('section-red')).toBeInTheDocument();
    expect(screen.getByTestId('section-session')).toBeInTheDocument();
    expect(screen.getByTestId('section-auditoria')).toBeInTheDocument();
    expect(screen.getByTestId('section-mapa')).toBeInTheDocument();
    expect(screen.getByTestId('section-background')).toBeInTheDocument();
  });

  it('shows network mode badge (online-direct shows "Conectado")', async () => {
    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByTestId('network-mode')).toBeInTheDocument();
    });
    expect(within(screen.getByTestId('network-mode')).getByText('Conectado')).toBeInTheDocument();
  });

  it('shows the map section empty state when getMapMeta returns null', async () => {
    vi.mocked(getMapMeta).mockResolvedValue(null);
    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByTestId('map-empty')).toBeInTheDocument();
    });
    expect(screen.getByTestId('map-empty')).toHaveTextContent('No descargado');
  });

  it('shows map metadata when installed', async () => {
    vi.mocked(getMapMeta).mockResolvedValue({
      key: 'map-pmtiles',
      filename: 'cuba.pmtiles',
      version: '2026-06-01',
      serverChecksum: 'abcdef0123456789',
      clientChecksum: 'abcdef0123456789',
      sizeBytes: 50_000_000,
      installedAt: 1700000000000,
    });

    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByTestId('map-installed')).toBeInTheDocument();
    });
    expect(screen.getByTestId('map-filename')).toHaveTextContent('cuba.pmtiles');
    expect(screen.getByTestId('map-version')).toHaveTextContent('2026-06-01');
  });

  it('opens diagnostic dialog with results when clicking "Ejecutar diagnóstico local"', async () => {
    setStoreCounts({ products: 10, corruptionQueue: 0 });
    setQuotaMock(5, true);
    vi.mocked(getMapMeta).mockResolvedValue(null);

    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.queryByTestId('data-loading')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('run-diagnostic'));

    await waitFor(() => {
      expect(screen.getByTestId('diagnostic-result')).toBeInTheDocument();
    });

    expect(screen.getByTestId('diagnostic-quota')).toBeInTheDocument();
    expect(screen.getByTestId('diagnostic-idb')).toBeInTheDocument();
    expect(screen.getByTestId('diagnostic-map')).toBeInTheDocument();
    expect(screen.getByTestId('diagnostic-outbox')).toBeInTheDocument();
    expect(screen.getByTestId('diagnostic-corruption')).toBeInTheDocument();
  });

  it('disables "Forzar resync" button when offline', async () => {
    vi.doMock('@/presentation/shared/hooks/storage/useSyncStatus', () => ({
      useSyncStatus: () => ({
        status: 'offline',
        pendingCount: 5,
        lastSyncAt: null,
        sync: syncMock,
        isOffline: true,
        isOnline: false,
        isSyncing: false,
        error: null,
      }),
    }));

    vi.resetModules();
    const { HealthPanel: HealthPanelOffline } = await import('./HealthPanel');

    render(<HealthPanelOffline />);

    await waitFor(() => {
      expect(screen.queryByTestId('data-loading')).not.toBeInTheDocument();
    });

    const btn = screen.getByTestId('force-resync') as HTMLButtonElement;
    expect(btn).toBeDisabled();
  });
});
