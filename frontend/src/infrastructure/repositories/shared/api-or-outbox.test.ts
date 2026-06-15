import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tryApiOrOutbox } from './api-or-outbox';

vi.mock('@/infrastructure/storage/networkStore', () => ({
  getNetworkMode: vi.fn(),
}));

vi.mock('@/infrastructure/api/client', () => ({
  isClientError: vi.fn(),
}));

vi.mock('@/infrastructure/storage/outbox', () => ({
  addToOutbox: vi.fn(),
}));

import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { isClientError } from '@/infrastructure/api/client';
import { addToOutbox } from '@/infrastructure/storage/outbox';

beforeEach(() => {
  vi.clearAllMocks();
});

const config = { entityType: 'PRODUCT', entityId: '', action: 'CREATE', payload: { name: 'Test' } };

describe('tryApiOrOutbox', () => {
  it('returns data when online and operation succeeds', async () => {
    vi.mocked(getNetworkMode).mockReturnValue('online-direct');
    const operation = vi.fn().mockResolvedValue({ id: '1', name: 'Test' });
    const result = await tryApiOrOutbox(operation, config);
    expect(result).toEqual({ id: '1', name: 'Test' });
    expect(operation).toHaveBeenCalledTimes(1);
    expect(addToOutbox).not.toHaveBeenCalled();
  });

  it('throws when online and operation fails with client error (4xx)', async () => {
    vi.mocked(getNetworkMode).mockReturnValue('online-direct');
    vi.mocked(isClientError).mockReturnValue(true);
    const error = new Error('Client error');
    const operation = vi.fn().mockRejectedValue(error);
    await expect(tryApiOrOutbox(operation, config)).rejects.toThrow('Client error');
    expect(addToOutbox).not.toHaveBeenCalled();
  });

  it('falls through to outbox when online and operation fails with non-client error (5xx)', async () => {
    vi.mocked(getNetworkMode).mockReturnValue('online-direct');
    vi.mocked(isClientError).mockReturnValue(false);
    const operation = vi.fn().mockRejectedValue(new Error('Server error'));
    const result = await tryApiOrOutbox(operation, config);
    expect(addToOutbox).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ name: 'Test', isTempId: true });
    expect(result).toHaveProperty('id');
  });

  it('goes to outbox when offline without calling operation', async () => {
    vi.mocked(getNetworkMode).mockReturnValue('offline');
    const operation = vi.fn();
    const result = await tryApiOrOutbox(operation, config);
    expect(operation).not.toHaveBeenCalled();
    expect(addToOutbox).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ name: 'Test', isTempId: true });
    expect(result).toHaveProperty('id');
  });

  it('uses online-degraded mode like online-direct', async () => {
    vi.mocked(getNetworkMode).mockReturnValue('online-degraded');
    const operation = vi.fn().mockResolvedValue('ok');
    const result = await tryApiOrOutbox(operation, config);
    expect(result).toBe('ok');
    expect(addToOutbox).not.toHaveBeenCalled();
  });
});
