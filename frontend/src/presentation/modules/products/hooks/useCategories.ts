'use client';

import { useQuery } from '@tanstack/react-query';
import { categoryRepository } from '@/infrastructure/repositories/CategoryRepository';
import type { Category } from '@/core/entities/category';

export function useCategories(activeOnly = true) {
  return useQuery<Category[]>({
    queryKey: ['categories', activeOnly],
    queryFn: () => categoryRepository.getAll(activeOnly),
    staleTime: 1000 * 60 * 5,
  });
}