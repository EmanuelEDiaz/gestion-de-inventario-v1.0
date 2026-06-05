import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';

vi.mock('@/infrastructure/storage/db', () => ({
  getDB: vi.fn(),
}));

vi.mock('@/infrastructure/storage/DownloadQueueService', () => ({
  DownloadQueueService: {
    fetchAllWithIntegrity: vi.fn(),
    downloadEntity: vi.fn(),
  },
}));

vi.mock('@/infrastructure/logging/appLogger', () => ({
  appLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { getDB } from '@/infrastructure/storage/db';
import { DownloadQueueService } from '@/infrastructure/storage/DownloadQueueService';
import { CorruptionRepairCenter } from './CorruptionRepairCenter';
import type { CorruptionEntry } from '@/core/loading/types/corruption';

type StoredEntry = CorruptionEntry & { id: number };
type Store = Map<number, StoredEntry>;

const fakeStore: Store = new Map();
let nextId = 1;

function makeFakeDb() {
  const put = vi.fn(async (_store: string, value: StoredEntry) => {
    const entry: StoredEntry = value.id != null ? value : { ...value, id: nextId++ };
    fakeStore.set(entry.id, entry);
    return entry.id;
  });

  const getAll = vi.fn(async () => Array.from(fakeStore.values()));

  return { put, getAll };
}

function makeEntry(overrides: Partial<CorruptionEntry> = {}): StoredEntry {
  return {
    id: nextId++,
    entityType: 'products',
    chunkKey: 'products-0',
    rawPayload: '{"id":"p-1","name":"Widget"}',
    parseError: 'schema mismatch at index 0',
    receivedAt: Date.now() - 60_000,
    status: 'pending',
    ...overrides,
  };
}

describe('CorruptionRepairCenter', () => {
  let fakeDb: ReturnType<typeof makeFakeDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeStore.clear();
    nextId = 1;
    fakeDb = makeFakeDb();
    vi.mocked(getDB).mockResolvedValue(fakeDb as never);
    vi.mocked(DownloadQueueService.fetchAllWithIntegrity).mockResolvedValue({
      ok: true,
      itemCount: 0,
      chunksProcessed: 0,
      chunksFailed: 0,
      corrupted: 0,
      errors: [],
      aborted: false,
    });
  });

  it('renders EmptyState when no pending entries exist', async () => {
    render(<CorruptionRepairCenter />);

    await waitFor(() => {
      expect(
        screen.getByText('No hay datos corruptos pendientes'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId('corruption-list')).not.toBeInTheDocument();
  });

  it('renders a row for each pending entry (filters out repaired/discarded)', async () => {
    const pending1 = makeEntry({ entityType: 'products', chunkKey: 'products-0' });
    const pending2 = makeEntry({ entityType: 'customers', chunkKey: 'customers-full' });
    const repaired = makeEntry({
      entityType: 'suppliers',
      chunkKey: 'suppliers-1',
      status: 'repaired',
    });
    const discarded = makeEntry({
      entityType: 'sales',
      chunkKey: 'sales-2',
      status: 'discarded',
    });
    fakeStore.set(pending1.id, pending1);
    fakeStore.set(pending2.id, pending2);
    fakeStore.set(repaired.id, repaired);
    fakeStore.set(discarded.id, discarded);

    render(<CorruptionRepairCenter />);

    await waitFor(() => {
      expect(screen.getByTestId('corruption-list')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pending-count')).toHaveTextContent('2 entrada(s) pendiente(s)');
    expect(screen.getByTestId(`corruption-row-${pending1.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`corruption-row-${pending2.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`corruption-row-${repaired.id}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`corruption-row-${discarded.id}`)).not.toBeInTheDocument();
  });

  it('shows the parse error, received date and entityType/chunkKey header', async () => {
    const entry = makeEntry({
      entityType: 'products',
      chunkKey: 'products-3',
      parseError: 'missing required field "name"',
      receivedAt: new Date('2026-06-01T10:00:00Z').getTime(),
    });
    fakeStore.set(entry.id, entry);

    render(<CorruptionRepairCenter />);

    const row = await screen.findByTestId(`corruption-row-${entry.id}`);
    expect(within(row).getByText('products')).toBeInTheDocument();
    expect(within(row).getByText('products-3')).toBeInTheDocument();
    expect(
      within(row).getByText('missing required field "name"'),
    ).toBeInTheDocument();
    expect(within(row).getByText(/Recibido:/)).toBeInTheDocument();
  });

  it('clicking "Descartar" updates status to "discarded" in IDB', async () => {
    const entry = makeEntry({ entityType: 'products' });
    fakeStore.set(entry.id, entry);

    render(<CorruptionRepairCenter />);

    const row = await screen.findByTestId(`corruption-row-${entry.id}`);
    fireEvent.click(within(row).getByTestId('discard-button'));

    await waitFor(() => {
      const stored = fakeStore.get(entry.id);
      expect(stored?.status).toBe('discarded');
    });

    // After status change, the component re-loads and removes the discarded row
    await waitFor(() => {
      expect(
        screen.queryByTestId(`corruption-row-${entry.id}`),
      ).not.toBeInTheDocument();
    });
    expect(fakeDb.put).toHaveBeenCalled();
  });

  it('clicking "Reparar y guardar" opens a dialog; saving valid JSON marks entry as "repaired"', async () => {
    const entry = makeEntry({
      rawPayload: '{"id":"p-1","name":',
      parseError: 'Unexpected end of JSON input',
    });
    fakeStore.set(entry.id, entry);

    render(<CorruptionRepairCenter />);

    const row = await screen.findByTestId(`corruption-row-${entry.id}`);
    fireEvent.click(within(row).getByTestId('repair-button'));

    const editor = await screen.findByTestId('repair-editor');
    fireEvent.change(editor, { target: { value: '{"id":"p-1","name":"Repaired Widget"}' } });

    fireEvent.click(screen.getByTestId('save-repair'));

    await waitFor(() => {
      const stored = fakeStore.get(entry.id);
      expect(stored?.status).toBe('repaired');
      expect(stored?.repairedPayload).toBe('{"id":"p-1","name":"Repaired Widget"}');
      expect(stored?.repairedAt).toBeGreaterThan(0);
    });
  });

  it('shows an inline error and does NOT save when JSON is invalid', async () => {
    const entry = makeEntry({ rawPayload: 'broken' });
    fakeStore.set(entry.id, entry);

    render(<CorruptionRepairCenter />);

    const row = await screen.findByTestId(`corruption-row-${entry.id}`);
    fireEvent.click(within(row).getByTestId('repair-button'));

    const editor = await screen.findByTestId('repair-editor');
    fireEvent.change(editor, { target: { value: '{not-valid-json' } });
    fireEvent.click(screen.getByTestId('save-repair'));

    await waitFor(() => {
      expect(screen.getByTestId('parse-error-inline')).toHaveTextContent('JSON inválido');
    });
    expect(fakeStore.get(entry.id)?.status).toBe('pending');
  });

  it('clicking "Reintentar descarga" calls DownloadQueueService.fetchAllWithIntegrity', async () => {
    const entry = makeEntry({ entityType: 'products', chunkKey: 'products-0' });
    fakeStore.set(entry.id, entry);

    render(<CorruptionRepairCenter />);

    const row = await screen.findByTestId(`corruption-row-${entry.id}`);
    const retryButton = within(row).getByRole('button', { name: /Reintentar descarga/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(DownloadQueueService.fetchAllWithIntegrity).toHaveBeenCalledTimes(1);
    });
    const [endpoint, store, , options] = vi.mocked(
      DownloadQueueService.fetchAllWithIntegrity,
    ).mock.calls[0];
    expect(endpoint).toBe('/api/v1/products');
    expect(store).toBe('products');
    expect(options).toMatchObject({ userId: 'products' });
  });

  it('renders the ErrorState when IDB fails to open', async () => {
    vi.mocked(getDB).mockRejectedValueOnce(new Error('IndexedDB open timed out'));

    render(<CorruptionRepairCenter />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/IndexedDB open timed out/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('expanding a row reveals the raw payload', async () => {
    const payload = '{"id":"p-1","name":"Widget","price":99.95}';
    const entry = makeEntry({ rawPayload: payload });
    fakeStore.set(entry.id, entry);

    render(<CorruptionRepairCenter />);

    const row = await screen.findByTestId(`corruption-row-${entry.id}`);
    const toggleButton = within(row).getByRole('button', { name: /Ver payload/i });
    fireEvent.click(toggleButton);

    expect(within(row).getByTestId('raw-payload')).toHaveTextContent(payload);
    expect(within(row).getByRole('button', { name: /Ocultar payload/i })).toBeInTheDocument();
  });
});
