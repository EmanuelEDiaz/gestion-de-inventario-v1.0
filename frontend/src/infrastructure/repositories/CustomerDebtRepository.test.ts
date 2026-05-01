import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerDebtRepository } from './CustomerDebtRepository';
import { customerDebtApi } from '@/infrastructure/api/customer-debt-api';
import type { CustomerDebt } from '@/core/entities/customer-debt';
import type { DebtPayment } from '@/core/entities/debt-payment';

vi.mock('@/infrastructure/api/customer-debt-api', () => ({
  customerDebtApi: {
    getAll: vi.fn(),
    getOverdue: vi.fn(),
    getById: vi.fn(),
    getByCustomer: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    registerPayment: vi.fn(),
  },
}));

const mockDebt: CustomerDebt = {
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

describe('CustomerDebtRepository', () => {
  let repo: CustomerDebtRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new CustomerDebtRepository();
  });

  it('findAll — calls api with status param', async () => {
    // Arrange
    vi.mocked(customerDebtApi.getAll).mockResolvedValue([mockDebt]);

    // Act
    const result = await repo.findAll('PENDING');

    // Assert
    expect(customerDebtApi.getAll).toHaveBeenCalledWith('PENDING');
    expect(result).toHaveLength(1);
  });

  it('findAll — calls api without status', async () => {
    // Arrange
    vi.mocked(customerDebtApi.getAll).mockResolvedValue([]);

    // Act
    const result = await repo.findAll();

    // Assert
    expect(customerDebtApi.getAll).toHaveBeenCalledWith(undefined);
    expect(result).toHaveLength(0);
  });

  it('findOverdue — delegates to api', async () => {
    // Arrange
    vi.mocked(customerDebtApi.getOverdue).mockResolvedValue([mockDebt]);

    // Act
    const result = await repo.findOverdue();

    // Assert
    expect(customerDebtApi.getOverdue).toHaveBeenCalled();
    expect(result[0].status).toBe('PENDING');
  });

  it('findById — returns debt on success', async () => {
    // Arrange
    vi.mocked(customerDebtApi.getById).mockResolvedValue(mockDebt);

    // Act
    const result = await repo.findById('debt-1');

    // Assert
    expect(result).not.toBeNull();
    expect(result?.id).toBe('debt-1');
  });

  it('findById — returns null on error', async () => {
    // Arrange
    vi.mocked(customerDebtApi.getById).mockRejectedValue(new Error('Not found'));

    // Act
    const result = await repo.findById('nonexistent');

    // Assert
    expect(result).toBeNull();
  });

  it('findByCustomer — calls api with customerId', async () => {
    // Arrange
    vi.mocked(customerDebtApi.getByCustomer).mockResolvedValue([mockDebt]);

    // Act
    const result = await repo.findByCustomer('cust-1');

    // Assert
    expect(customerDebtApi.getByCustomer).toHaveBeenCalledWith('cust-1');
    expect(result).toHaveLength(1);
  });

  it('cancel — calls api cancel', async () => {
    // Arrange
    const cancelled = { ...mockDebt, status: 'CANCELLED' as const };
    vi.mocked(customerDebtApi.cancel).mockResolvedValue(cancelled);

    // Act
    const result = await repo.cancel('debt-1');

    // Assert
    expect(result.status).toBe('CANCELLED');
  });

  it('registerPayment — returns DebtPayment', async () => {
    // Arrange
    const mockPayment: DebtPayment = {
      id: 'pay-1',
      debtId: 'debt-1',
      amount: 200,
      paymentMethod: 'CASH',
      notes: null,
      registeredBy: 'user-1',
      createdAt: '2026-01-01T10:00:00Z',
    };
    vi.mocked(customerDebtApi.registerPayment).mockResolvedValue(mockPayment);

    // Act
    const result = await repo.registerPayment('debt-1', { amount: 200, paymentMethod: 'CASH' });

    // Assert
    expect(result.amount).toBe(200);
    expect(result.debtId).toBe('debt-1');
  });
});
