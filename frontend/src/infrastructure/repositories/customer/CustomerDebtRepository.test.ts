import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerDebtRepository } from './CustomerDebtRepository';
import { apiClient } from '../../api/client';
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import { addToOutbox } from '@/infrastructure/storage/outbox';
import type { CustomerDebt, UpdateDebtData } from '@/core/customer/entities/customer-debt';
import type { DebtPayment } from '@/core/customer/entities/debt-payment';

vi.mock('../../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const baseDebt: CustomerDebt = {
  id: 'debt-1',
  customerId: 'cust-1',
  saleId: 'sale-1',
  originalAmount: 500,
  paidAmount: 0,
  pendingAmount: 500,
  currencyCode: 'USD',
  status: 'PENDING',
  description: null,
  dueDate: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const fakeStore = new Map<string, unknown>();
const fakeDb = {
  getAll: vi.fn(async (store: string) =>
    Array.from(fakeStore.values()).filter((v) => (v as { __store?: string }).__store === store)
  ),
  get: vi.fn(async (store: string, id: string) => fakeStore.get(`${store}:${id}`)),
  getAllFromIndex: vi.fn(async (store: string, _index: string, value: string) =>
    Array.from(fakeStore.values()).filter(
      (v) => (v as { __store?: string; customerId?: string }).__store === store &&
             (v as { customerId?: string }).customerId === value
    )
  ),
  put: vi.fn(async (store: string, value: unknown) => {
    const id = (value as { id?: string }).id ?? crypto.randomUUID();
    fakeStore.set(`${store}:${id}`, { ...(value as object), __store: store });
    return id;
  }),
  delete: vi.fn(async (store: string, id: string) => { fakeStore.delete(`${store}:${id}`); }),
  transaction: vi.fn(),
};

vi.mock('@/infrastructure/storage/db', () => ({
  getDB: vi.fn(async () => fakeDb),
  safeCacheWrite: vi.fn(async (op: () => Promise<unknown>) => op()),
}));

vi.mock('@/infrastructure/storage/networkStore', () => ({
  getNetworkMode: vi.fn(() => 'online-direct' as const),
}));

vi.mock('@/infrastructure/storage/outbox', () => ({
  addToOutbox: vi.fn(async () => undefined),
}));

describe('CustomerDebtRepository (local-first)', () => {
  let repo: CustomerDebtRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeStore.clear();
    repo = new CustomerDebtRepository();
  });

  describe('reads (local-first, no HTTP)', () => {
    it('findAll returns all debts from IDB', async () => {
      fakeStore.set('customerDebts:debt-1', { __store: 'customerDebts', ...baseDebt });
      fakeStore.set('customerDebts:debt-2', { __store: 'customerDebts', ...baseDebt, id: 'debt-2', status: 'PAID' });

      const result = await repo.findAll();

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('findAll filters by status', async () => {
      fakeStore.set('customerDebts:debt-1', { __store: 'customerDebts', ...baseDebt, status: 'PENDING' });
      fakeStore.set('customerDebts:debt-2', { __store: 'customerDebts', ...baseDebt, id: 'debt-2', status: 'PAID' });

      const result = await repo.findAll('PENDING');

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe('PENDING');
    });

    it('findOverdue filters by dueDate < now and unpaid status', async () => {
      const pastDate = '2020-01-01T00:00:00Z';
      fakeStore.set('customerDebts:debt-1', { __store: 'customerDebts', ...baseDebt, dueDate: pastDate });
      fakeStore.set('customerDebts:debt-2', { __store: 'customerDebts', ...baseDebt, id: 'debt-2', status: 'PAID', dueDate: pastDate });

      const result = await repo.findOverdue();

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('debt-1');
    });

    it('findById returns debt from IDB', async () => {
      fakeStore.set('customerDebts:debt-1', { __store: 'customerDebts', ...baseDebt });

      const result = await repo.findById('debt-1');

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.id).toBe('debt-1');
    });

    it('findById returns null for missing debt', async () => {
      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('findByCustomer uses by-customer index', async () => {
      fakeStore.set('customerDebts:debt-1', { __store: 'customerDebts', ...baseDebt, customerId: 'cust-1' });
      fakeStore.set('customerDebts:debt-2', { __store: 'customerDebts', ...baseDebt, id: 'debt-2', customerId: 'cust-2' });

      const result = await repo.findByCustomer('cust-1');

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('debt-1');
    });
  });

  describe('writes (HTTP-first with outbox fallback)', () => {
    it('update calls HTTP and updates cache on success', async () => {
      const updateData: UpdateDebtData = { description: 'Updated' };
      const updated = { ...baseDebt, description: 'Updated' };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: updated });

      const result = await repo.update('debt-1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/debts/debt-1', updateData);
      expect(result.description).toBe('Updated');
    });

    it('cancel calls HTTP and updates cache on success', async () => {
      const cancelled = { ...baseDebt, status: 'CANCELLED' as const };
      vi.mocked(apiClient.post).mockResolvedValue({ data: cancelled });

      const result = await repo.cancel('debt-1');

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/debts/debt-1/cancel');
      expect(result.status).toBe('CANCELLED');
    });

    it('registerPayment calls HTTP and returns DebtPayment', async () => {
      const mockPayment: DebtPayment = {
        id: 'pay-1', debtId: 'debt-1', amount: 200,
        paymentMethod: 'CASH', notes: null, registeredBy: 'user-1',
        createdAt: '2026-01-01T10:00:00Z',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockPayment });

      const result = await repo.registerPayment('debt-1', { amount: 200, paymentMethod: 'CASH' });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/debts/debt-1/payments', { amount: 200, paymentMethod: 'CASH' });
      expect(result.amount).toBe(200);
    });
  });

  describe('writes (offline -> outbox)', () => {
    beforeEach(() => {
      vi.mocked(getNetworkMode).mockReturnValue('offline' as never);
    });

    it('update goes to outbox when offline', async () => {
      const result = await repo.update('debt-1', { description: 'Pending' });

      expect(apiClient.patch).not.toHaveBeenCalled();
      expect(addToOutbox).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE', entityType: 'CUSTOMER_DEBT' })
      );
      expect(result.id).toBe('debt-1');
    });

    it('cancel goes to outbox when offline', async () => {
      const result = await repo.cancel('debt-1');

      expect(apiClient.post).not.toHaveBeenCalled();
      expect(addToOutbox).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CANCEL', entityType: 'CUSTOMER_DEBT' })
      );
      expect(result.status).toBe('CANCELLED');
    });

    it('registerPayment goes to outbox when offline', async () => {
      const result = await repo.registerPayment('debt-1', { amount: 200, paymentMethod: 'CASH' });

      expect(apiClient.post).not.toHaveBeenCalled();
      expect(addToOutbox).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REGISTER_PAYMENT', entityType: 'DEBT_PAYMENT' })
      );
      expect(result.id).toMatch(/^temp_/);
    });

    it('update goes to outbox when HTTP fails in online-degraded', async () => {
      vi.mocked(getNetworkMode).mockReturnValue('online-degraded' as never);
      vi.mocked(apiClient.patch).mockRejectedValue(new Error('network'));

      await repo.update('debt-1', { description: 'Pending' });

      expect(apiClient.patch).toHaveBeenCalled();
      expect(addToOutbox).toHaveBeenCalled();
    });
  });
});
