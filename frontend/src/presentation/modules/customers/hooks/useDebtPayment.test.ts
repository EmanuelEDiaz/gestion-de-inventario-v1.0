import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebtPayment } from './useDebtPayment';

vi.mock('@/infrastructure/api/customer-debt-api', () => ({
  customerDebtApi: {
    registerPayment: vi.fn(),
  },
}));

describe('useDebtPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna la mutación de pago', () => {
    // Arrange
    const mockMutation = { mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>;
    vi.mocked(useMutation).mockReturnValue(mockMutation);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    const { result } = renderHook(() => useDebtPayment('cust-1'));

    // Assert
    expect(result.current.mutateAsync).toBeDefined();
  });

  it('llama a useMutation una vez al inicializar', () => {
    // Arrange
    vi.mocked(useMutation).mockReturnValue({ mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    renderHook(() => useDebtPayment('cust-1'));

    // Assert
    expect(useMutation).toHaveBeenCalledTimes(1);
  });

  it('invalida las deudas del cliente correcto al ejecutar onSuccess', () => {
    // Arrange
    const invalidateQueries = vi.fn();
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries } as unknown as ReturnType<typeof useQueryClient>);
    let capturedOnSuccess: (() => void) | undefined;
    vi.mocked(useMutation).mockImplementation(((opts: { onSuccess?: () => void }) => {
      capturedOnSuccess = opts.onSuccess;
      return { mutateAsync: vi.fn() };
    }) as unknown as typeof useMutation);

    // Act
    renderHook(() => useDebtPayment('cust-42'));
    capturedOnSuccess?.();

    // Assert
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['customer-debts', 'cust-42'] });
  });
});
