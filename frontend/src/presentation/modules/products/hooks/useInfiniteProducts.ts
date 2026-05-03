'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { productRepository } from '@/infrastructure/repositories/ProductRepository';

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_MAX_PAGES = 20;

export interface UseInfiniteProductsOptions {
  maxPages?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  unitOfMeasure?: string;
  sortBy?: string;
  sortAsc?: boolean;
  activeOnly?: boolean;
}

export function useInfiniteProducts(options: UseInfiniteProductsOptions = {}) {
  const { 
    maxPages = DEFAULT_MAX_PAGES,
    search,
    categoryId,
    status,
    minPrice,
    maxPrice,
    unitOfMeasure,
    sortBy = 'name',
    sortAsc = true,
    activeOnly = false,
  } = options;

  return useInfiniteQuery({
    queryKey: ['products', 'infinite', options],
    queryFn: ({ pageParam }) => 
      productRepository.getAllWithCursor(pageParam, DEFAULT_PAGE_SIZE, {
        search,
        categoryId,
        status,
        minPrice,
        maxPrice,
        unitOfMeasure,
        sortBy,
        sortAsc,
        activeOnly,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    maxPages,
    staleTime: 1000 * 60 * 5,
  });
}