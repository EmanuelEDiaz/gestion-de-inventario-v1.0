'use client';

import { useState, useMemo, useCallback } from 'react';
import { useInfiniteProducts } from '../hooks/useInfiniteProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductTable } from './table/ProductTable';
import { ProductSearchBar } from './filters/ProductSearchBar';
import { ProductFiltersPanel, type ProductFiltersState } from './ProductFiltersPanel';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/EmptyState';
import { DEFAULT_UI_PREFS } from '@/core/entities/app-settings';
import { useSort } from '@/presentation/shared/hooks/useSort';

const initialFilters: ProductFiltersState = {
  search: '',
  categoryId: '',
  status: '',
  minPrice: '',
  maxPrice: '',
  unitOfMeasure: '',
};

interface ProductsInfiniteListProps {
  maxPages?: number;
}

export function ProductsInfiniteList({ maxPages = 20 }: ProductsInfiniteListProps) {
  const debounceMs = DEFAULT_UI_PREFS.searchDebounceMs;

  const [filters, setFilters] = useState<ProductFiltersState>(initialFilters);
  const { sortKey, sortDirection, handleSort } = useSort();

  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories(true);

  const filterParams = useMemo(() => ({
    search: filters.search || undefined,
    categoryId: filters.categoryId || undefined,
    status: filters.status || undefined,
    minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    unitOfMeasure: filters.unitOfMeasure || undefined,
    sortBy: sortKey,
    sortAsc: sortDirection === 'asc',
  }), [filters, sortKey, sortDirection]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteProducts({
    maxPages,
    ...filterParams,
  });

  const products = data?.pages.flatMap((page) => page.items) ?? [];

  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const handleFiltersChange = useCallback((newFilters: ProductFiltersState) => {
    setFilters(newFilters);
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <EmptyState
        message="Error al cargar productos"
        action={
          <Button onClick={() => refetch()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <ProductSearchBar
          onSearch={handleSearch}
          placeholder="Buscar por nombre, SKU o código de barras..."
          debounceMs={debounceMs}
        />
        
        {!isLoadingCategories && categoriesData && (
          <ProductFiltersPanel
            filters={filters}
            onChange={handleFiltersChange}
            categories={categoriesData}
          />
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState message="No hay productos registrados con los filtros aplicados" />
      ) : (
        <>
          <ProductTable
            products={products}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            onDeleteSuccess={handleDeleteSuccess}
          />
          
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Cargando...
                  </>
                ) : (
                  'Cargar más productos'
                )}
              </Button>
            </div>
          )}
          
          {!hasNextPage && products.length > 0 && (
            <p className="text-center text-sm text-gray-500">
              No hay más productos para mostrar
            </p>
          )}
        </>
      )}
    </div>
  );
}