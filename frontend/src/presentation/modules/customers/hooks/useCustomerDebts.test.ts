import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { useCustomerDebts } from './useCustomerDebts';
import type { CustomerDebt } from '@/core/entities/customer-debt';

const mockDebt: CustomerDebt = {
  id: 'debt-1',
  customerId: 'cust-1',
  saleId: 'sale-1',
  originalAmount: 300,
  paidAmount: 100,
  pendingAmount: 200,
  currencyCode: 'PEN',
  status: 'PARTIAL',
  description: 'Compra fiada',
  dueDate: '2026-02-01',
  notes: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-15T00:00:00Z',
};

vi.mock('@/infrastructure/api/customer-debt-api', () => ({
  customerDebtApi: {
    getByCustomer: vi.fn(),
  },
}));

describe('useCustomerDebts', () => {
  it('retorna deudas del cliente', () => {
    // Arrange
    vi.mocked(useQuery).mockReturnValue({
      data: [mockDebt],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>);

    // Act
    const { result } = renderHook(() => useCustomerDebts('cust-1'));

    // Assert
    expect(result.current.debts).toEqual([mockDebt]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('retorna lista vacía cuando no hay deudas', () => {
    // Arrange
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>);

    // Act
    const { result } = renderHook(() => useCustomerDebts('cust-1'));

    // Assert
    expect(result.current.debts).toEqual([]);
  });

  it('retorna isLoading=true mientras carga', () => {
    // Arrange
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useQuery>);

    // Act
    const { result } = renderHook(() => useCustomerDebts('cust-1'));

    // Assert
    expect(result.current.isLoading).toBe(true);
  });
});
