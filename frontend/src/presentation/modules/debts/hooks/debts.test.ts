import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDebts, useOverdueDebts } from './useDebts';
import { useDebtDetail } from './useDebtDetail';
import { useUpdateDebt, useCancelDebt } from './useUpdateDebt';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/infrastructure/repositories/customer/CustomerDebtRepository', () => ({
  CustomerDebtRepository: class {
    findAll = vi.fn().mockResolvedValue([]);
    findOverdue = vi.fn().mockResolvedValue([]);
    findById = vi.fn().mockResolvedValue(null);
    update = vi.fn().mockResolvedValue({});
    cancel = vi.fn().mockResolvedValue({});
  },
}));

vi.mock('@/presentation/shared/components/ui/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { useQuery, useMutation } = await import('@tanstack/react-query') as {
  useQuery: ReturnType<typeof vi.fn>;
  useMutation: ReturnType<typeof vi.fn>;
};

describe('useDebts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama useQuery con la clave correcta para todos los estados', () => {
    // Arrange
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: [], isLoading: false });

    // Act
    renderHook(() => useDebts());

    // Assert
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['debts', 'all'] }),
    );
  });

  it('llama useQuery con estado filtrado cuando se pasa status', () => {
    // Arrange
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: [], isLoading: false });

    // Act
    renderHook(() => useDebts('PENDING'));

    // Assert
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['debts', 'PENDING'] }),
    );
  });

  it('useDebtDetail tiene enabled:false cuando id es vacío', () => {
    // Arrange
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: null, isLoading: false });

    // Act
    renderHook(() => useDebtDetail(''));

    // Assert
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it('useUpdateDebt llama useMutation con mutationFn', () => {
    // Arrange
    (useMutation as ReturnType<typeof vi.fn>).mockReturnValue({ mutate: vi.fn(), isPending: false });

    // Act
    renderHook(() => useUpdateDebt('debt-1'));

    // Assert
    expect(useMutation).toHaveBeenCalledWith(
      expect.objectContaining({ mutationFn: expect.any(Function) }),
    );
  });
});
