'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { productRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { userPreferencesRepository } from '@/infrastructure/repositories/user/UserPreferencesRepository';
import type { ProductStatus, UnitOfMeasure } from '@/core/product/entities/product';

export interface UsePaginatedProductsOptions {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  unitOfMeasure?: UnitOfMeasure;
}

export function usePaginatedProducts(options: UsePaginatedProductsOptions = {}) {
  const { search, categoryId, status, minPrice, maxPrice, unitOfMeasure } = options;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    userPreferencesRepository.getMaxProductPages().then(setPageSize);
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, categoryId, status, minPrice, maxPrice, unitOfMeasure]);

  const query = useQuery({
    queryKey: ['products', 'paginated', page, pageSize, search, categoryId, status, minPrice, maxPrice, unitOfMeasure],
    queryFn: () => productRepository.getAllPaginated({
      search,
      categoryId,
      status,
      minPrice,
      maxPrice,
      unitOfMeasure,
      page,
      size: pageSize,
      sortBy: 'name',
      sortAsc: true,
    }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    products: query.data?.content ?? [],
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    page,
    setPage,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    pageSize,
  };
}
