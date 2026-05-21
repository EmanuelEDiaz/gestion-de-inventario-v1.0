import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupplierCatalog } from './useSupplierCatalog';
import type { SupplierCatalogProduct } from '@/core/supplier/entities/supplier-catalog-product';

const mockProduct: SupplierCatalogProduct = {
  id: 'cat-1',
  supplierId: 'sup-1',
  productId: null,
  description: 'Tornillos M6',
  unitPrice: 0.5,
  currencyCode: 'USD',
};

vi.mock('@/infrastructure/api/supplier-catalog-product-api', () => ({
  supplierCatalogProductApi: {
    list: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('useSupplierCatalog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna productos del catálogo y estado de carga', () => {
    // Arrange
    vi.mocked(useQuery).mockReturnValue({
      data: [mockProduct],
      isLoading: false,
    } as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue({ mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    const { result } = renderHook(() => useSupplierCatalog('sup-1'));

    // Assert
    expect(result.current.products).toEqual([mockProduct]);
    expect(result.current.isLoading).toBe(false);
  });

  it('retorna lista vacía cuando no hay productos', () => {
    // Arrange
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue({ mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    const { result } = renderHook(() => useSupplierCatalog('sup-1'));

    // Assert
    expect(result.current.products).toEqual([]);
  });

  it('expone mutaciones add y remove', () => {
    // Arrange
    const mockMutate = { mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>;
    vi.mocked(useQuery).mockReturnValue({ data: [], isLoading: false } as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue(mockMutate);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    const { result } = renderHook(() => useSupplierCatalog('sup-1'));

    // Assert
    expect(result.current.add).toBeDefined();
    expect(result.current.remove).toBeDefined();
  });
});
