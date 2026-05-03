'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { productRepository } from '@/infrastructure/repositories/ProductRepository';

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_MAX_PAGES = 20;

export function useInfiniteProducts(maxPages: number = DEFAULT_MAX_PAGES) {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite'],
    queryFn: ({ pageParam }) => 
      productRepository.getAllWithCursor(pageParam, DEFAULT_PAGE_SIZE),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    maxPages,
    staleTime: 1000 * 60 * 5,
  });
}