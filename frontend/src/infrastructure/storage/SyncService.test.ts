import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pushOutbox } from './SyncService';

vi.mock('@/infrastructure/api/client', () => ({
  apiClient: { post: vi.fn(), get: vi.fn() },
  getFieldErrors: vi.fn(),
  isClientError: vi.fn(),
}));

vi.mock('axios', () => ({
  default: { isAxiosError: vi.fn() },
  isAxiosError: vi.fn(),
}));

vi.mock('./db', () => ({
  getDB: vi.fn(),
  getSyncMeta: vi.fn(),
  setSyncMeta: vi.fn(),
  getStoreCursor: vi.fn(),
  setStoreCursor: vi.fn(),
  batchPut: vi.fn(),
}));

vi.mock('./outbox', () => ({
  getPendingOutbox: vi.fn(),
  removeFromOutbox: vi.fn(),
  markOutboxEntry: vi.fn(),
  moveToDeadLetter: vi.fn(),
  updateRetry: vi.fn(),
}));

vi.mock('./networkStore', () => ({
  getNetworkMode: vi.fn(),
}));

import { apiClient, getFieldErrors } from '@/infrastructure/api/client';
import axios from 'axios';
import { getPendingOutbox, markOutboxEntry, moveToDeadLetter, updateRetry, removeFromOutbox } from './outbox';
import { getNetworkMode } from './networkStore';
import { getDB } from './db';

beforeEach(() => {
  vi.clearAllMocks();
});

const baseEntry = {
  id: 1,
  operationId: 'op-1',
  entityType: 'PRODUCT',
  entityId: 'temp-1',
  action: 'CREATE',
  payload: { name: 'New Product' },
  status: 'pending' as const,
  priority: 0 as const,
  retryCount: 0,
  maxRetries: 5,
  nextRetryAt: 0,
  expiresAt: Date.now() + 86400000,
  createdAt: 0,
};

describe('pushOutbox', () => {
  describe('fieldErrors handling in error path', () => {
    beforeEach(() => {
      vi.mocked(getNetworkMode).mockReturnValue('online-direct');
      vi.mocked(getPendingOutbox).mockResolvedValue([baseEntry]);
      vi.mocked(markOutboxEntry).mockResolvedValue(undefined);
      vi.mocked(moveToDeadLetter).mockResolvedValue(undefined);
      vi.mocked(updateRetry).mockResolvedValue(undefined);
      vi.mocked(removeFromOutbox).mockResolvedValue(undefined);
    });

    it('saves fieldErrors when API returns 400 with fieldErrors (axios error)', async () => {
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      vi.mocked(getFieldErrors).mockReturnValue([{ field: 'name', message: 'Name is required' }]);

      const axiosError = {
        isAxiosError: true,
        response: { status: 400, data: { fieldErrors: [{ field: 'name', message: 'Name is required' }] } },
      };
      vi.mocked(apiClient.post).mockRejectedValue(axiosError);

      const fakeDb = {
        put: vi.fn().mockResolvedValue(undefined),
        getAllFromIndex: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        add: vi.fn(),
        count: vi.fn(),
        transaction: vi.fn(),
      };
      vi.mocked(getDB).mockResolvedValue(fakeDb as never);

      const result = await pushOutbox();

      expect(result.failed).toBeGreaterThan(0);
      expect(result.incidents.some((i) => i.includes('rejected with field errors'))).toBe(true);
      expect(getFieldErrors).toHaveBeenCalledWith(axiosError);
      expect(fakeDb.put).toHaveBeenCalled();
    });

    it('does NOT save fieldErrors when non-axios error without fieldErrors', async () => {
      vi.mocked(axios.isAxiosError).mockReturnValue(false);
      vi.mocked(getFieldErrors).mockReturnValue([]);

      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      const fakeDb = {
        put: vi.fn().mockResolvedValue(undefined),
        getAllFromIndex: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        add: vi.fn(),
        count: vi.fn(),
        transaction: vi.fn(),
      };
      vi.mocked(getDB).mockResolvedValue(fakeDb as never);

      const result = await pushOutbox();

      expect(result.failed).toBeGreaterThan(0);
      expect(updateRetry).toHaveBeenCalled();
      expect(result.incidents.some((i) => i.includes('unexpected error, retry'))).toBe(true);
    });

    it('moves to dead letter on 404 status', async () => {
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const axiosError = {
        isAxiosError: true,
        response: { status: 404, data: {} },
      };
      vi.mocked(apiClient.post).mockRejectedValue(axiosError);

      const fakeDb = {
        put: vi.fn().mockResolvedValue(undefined),
        getAllFromIndex: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        add: vi.fn(),
        count: vi.fn(),
        transaction: vi.fn(),
      };
      vi.mocked(getDB).mockResolvedValue(fakeDb as never);

      const result = await pushOutbox();

      expect(result.failed).toBeGreaterThan(0);
      expect(moveToDeadLetter).toHaveBeenCalled();
      expect(result.incidents.some((i) => i.includes('failed with status 404'))).toBe(true);
    });
  });
});
