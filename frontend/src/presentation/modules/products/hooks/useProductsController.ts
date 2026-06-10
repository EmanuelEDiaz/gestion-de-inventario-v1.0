/**
 * useProductsController - Entry adapter (controller) for products module
 * Orchestrates UI state and use cases, no business logic here
 */

import { useState, useCallback, useEffect } from 'react';
import type { Product, ProductFilters } from '@/core/product/entities/product';
import { GetProductsUseCase } from '@/core/product/use-cases/GetProductsUseCase';
import { productRepository } from '@/infrastructure/repositories/product/ProductRepository';

interface UseProductsControllerState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    totalElements: number;
  };
}

const getProductsUseCase = new GetProductsUseCase(productRepository);

export function useProductsController(initialFilters?: ProductFilters) {
  const [state, setState] = useState<UseProductsControllerState>({
    products: [],
    isLoading: true,
    error: null,
    pagination: { page: 0, totalPages: 0, totalElements: 0 },
  });
  const [filters, setFilters] = useState<ProductFilters>(initialFilters ?? {});

  const fetchProducts = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await getProductsUseCase.execute(filters);
      setState({
        products: result.content,
        isLoading: false,
        error: null,
        pagination: {
          page: result.number,
          totalPages: result.totalPages,
          totalElements: result.totalElements,
        },
      });
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar productos',
      }));
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 0 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    filters,
    handleSearch,
    handlePageChange,
    refresh: fetchProducts,
    clearError,
  };
}
