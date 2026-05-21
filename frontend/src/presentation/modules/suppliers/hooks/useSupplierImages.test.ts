import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupplierImages } from './useSupplierImages';
import type { SupplierImage } from '@/core/supplier/entities/supplier-image';

const mockImage: SupplierImage = {
  id: 'img-1',
  supplierId: 'sup-1',
  sortOrder: 0,
  isPrimary: true,
  contentType: 'image/jpeg',
  filePath: '/media/suppliers/img-1.jpg',
  originalFilename: 'foto.jpg',
  sizeBytes: 1024,
  createdAt: '2026-01-01T00:00:00Z',
};

vi.mock('@/infrastructure/api/image-upload-api', () => ({
  supplierImageApi: {
    list: vi.fn(),
    upload: vi.fn(),
    setPrimary: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useSupplierImages', () => {
  it('retorna imágenes y estados iniciales', () => {
    // Arrange
    vi.mocked(useQuery).mockReturnValue({
      data: [mockImage],
      isLoading: false,
    } as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue({ mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    const { result } = renderHook(() => useSupplierImages('sup-1'));

    // Assert
    expect(result.current.images).toEqual([mockImage]);
    expect(result.current.isLoading).toBe(false);
  });

  it('retorna lista vacía cuando no hay imágenes', () => {
    // Arrange
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue({ mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    const { result } = renderHook(() => useSupplierImages('sup-1'));

    // Assert
    expect(result.current.images).toEqual([]);
  });

  it('expone mutaciones upload, setPrimary y remove', () => {
    // Arrange
    const mockMutate = { mutateAsync: vi.fn() } as unknown as ReturnType<typeof useMutation>;
    vi.mocked(useQuery).mockReturnValue({ data: [], isLoading: false } as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue(mockMutate);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries: vi.fn() } as unknown as ReturnType<typeof useQueryClient>);

    // Act
    const { result } = renderHook(() => useSupplierImages('sup-1'));

    // Assert
    expect(result.current.upload).toBeDefined();
    expect(result.current.setPrimary).toBeDefined();
    expect(result.current.remove).toBeDefined();
  });
});
