import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupplierSocialLinks } from './useSupplierSocialLinks';
import type { SupplierSocialLink } from '@/core/entities/supplier-social-link';

const mockLink: SupplierSocialLink = {
  id: 'link-1',
  supplierId: 'sup-1',
  platform: 'INSTAGRAM',
  url: 'https://instagram.com/acme',
  label: null,
  sortOrder: 0,
};

vi.mock('@/infrastructure/api/supplier-social-link-api', () => ({
  supplierSocialLinkApi: {
    list: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('useSupplierSocialLinks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna enlaces y estado de carga', () => {
    // Arrange
    vi.mocked(useQuery).mockReturnValue({
      data: [mockLink],
      isLoading: false,
    } as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue({ mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    const { result } = renderHook(() => useSupplierSocialLinks('sup-1'));

    // Assert
    expect(result.current.links).toEqual([mockLink]);
    expect(result.current.isLoading).toBe(false);
  });

  it('retorna lista vacía cuando no hay enlaces', () => {
    // Arrange
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue({ mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    const { result } = renderHook(() => useSupplierSocialLinks('sup-1'));

    // Assert
    expect(result.current.links).toEqual([]);
  });

  it('expone mutaciones add y remove', () => {
    // Arrange
    const mockMutate = { mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>;
    vi.mocked(useQuery).mockReturnValue({ data: [], isLoading: false } as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue(mockMutate);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    const { result } = renderHook(() => useSupplierSocialLinks('sup-1'));

    // Assert
    expect(result.current.add).toBeDefined();
    expect(result.current.remove).toBeDefined();
  });
});
