import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePosCart } from './usePosCart';

vi.mock('@/infrastructure/repositories/sale/SaleRepository', () => ({
  saleRepository: {},
}));

vi.mock('@/core/sale/use-cases', () => ({
  CreateSaleUseCase: class {
    execute = vi.fn().mockResolvedValue({ id: 'sale-1', saleNumber: 'V-001' });
  },
}));

vi.mock('@/presentation/shared/components/ui/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('usePosCart', () => {
  beforeEach(() => vi.clearAllMocks());

  it('agrega una línea al carrito y acumula si el mismo producto se agrega dos veces', () => {
    // Arrange
    const { result } = renderHook(() => usePosCart());

    // Act
    act(() => {
      result.current.addLine({
        productId: 'p1',
        productName: 'Producto 1',
        quantity: 2,
        unitPrice: 10,
        discount: 0,
      });
      result.current.addLine({
        productId: 'p1',
        productName: 'Producto 1',
        quantity: 3,
        unitPrice: 10,
        discount: 0,
      });
    });

    // Assert
    expect(result.current.lines).toHaveLength(1);
    expect(result.current.lines[0].quantity).toBe(5);
    expect(result.current.total).toBe(50);
  });

  it('valida que paymentMode CREDIT sin cliente no procesa la venta', async () => {
    // Arrange
    const { toast: toastMock } = await import('@/presentation/shared/components/ui/toast') as unknown as { toast: { error: ReturnType<typeof vi.fn> } };
    const { result } = renderHook(() => usePosCart());

    // Act
    act(() => {
      result.current.setWarehouse('w1');
      result.current.setPaymentMode('CREDIT');
      result.current.addLine({ productId: 'p1', productName: 'P1', quantity: 1, unitPrice: 10, discount: 0 });
    });
    let ok: boolean;
    await act(async () => { ok = await result.current.confirm(); });

    // Assert
    expect(ok!).toBe(false);
    expect(toastMock.error).toHaveBeenCalled();
  });

  it('limpia el carrito con clearCart', () => {
    // Arrange
    const { result } = renderHook(() => usePosCart());

    // Act
    act(() => {
      result.current.addLine({ productId: 'p1', productName: 'P1', quantity: 2, unitPrice: 5, discount: 0 });
      result.current.clearCart();
    });

    // Assert
    expect(result.current.lines).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('setPaymentMode IMMEDIATE limpia el cliente', () => {
    // Arrange
    const { result } = renderHook(() => usePosCart());

    // Act
    act(() => {
      result.current.setPaymentMode('CREDIT');
      result.current.setCustomer({ id: 'c1', name: 'Cliente Test', code: 'C001', active: true, version: 1, createdAt: '', updatedAt: '' });
    });
    act(() => {
      result.current.setPaymentMode('IMMEDIATE');
    });

    // Assert
    expect(result.current.customer).toBeNull();
    expect(result.current.paymentMode).toBe('IMMEDIATE');
  });
});
