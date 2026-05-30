'use client';

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { useInfiniteProducts } from '../hooks/useInfiniteProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductTable } from './table/ProductTable';
import { productRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { DEFAULT_UI_PREFS } from '@/core/settings/entities/app-settings';
import { useSort } from '@/presentation/shared/hooks/ui/useSort';
import { InfiniteListToolbar } from './InfiniteListToolbar';
import { InfiniteListFooter } from './InfiniteListFooter';
import type { ProductFiltersState } from './ProductFiltersPanel';

interface ProductsInfiniteListProps {
  maxPages?: number;
}

export function ProductsInfiniteList({ maxPages = 20 }: ProductsInfiniteListProps) {
  const debounceMs = DEFAULT_UI_PREFS.searchDebounceMs;
  const [filters, setFilters] = useState<ProductFiltersState>({
    search: '', categoryId: '', status: '', minPrice: '', maxPrice: '', unitOfMeasure: '',
  });
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
    data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch,
  } = useInfiniteProducts({ maxPages, ...filterParams });
  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const handleSearch = useCallback((search: string) => setFilters((prev) => ({ ...prev, search })), []);
  const handleFiltersChange = useCallback((newFilters: ProductFiltersState) => setFilters(newFilters), []);
  const handleDeleteSuccess = useCallback(() => refetch(), [refetch]);
  const handleDeleteSelected = useCallback(async (ids: string[]) => {
    if (!confirm(`¿Eliminar ${ids.length} producto(s)?`)) return;
    try {
      await productRepository.deleteAll(ids);
      refetch();
    } catch {
      toast.error('Error al eliminar productos');
    }
  }, [refetch]);

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <EmptyState message="Error al cargar productos" action={<TooltipWrapper content="Reintentar carga de productos" side="top"><Button onClick={() => refetch()}>Reintentar</Button></TooltipWrapper>} />
    );
  }

  return (
    <div className="space-y-4">
      <InfiniteListToolbar
        onSearch={handleSearch}
        placeholder="Buscar por nombre, SKU o código de barras..."
        debounceMs={debounceMs}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categoriesData ?? []}
        isLoadingCategories={isLoadingCategories}
      />
      {products.length === 0 ? (
        <EmptyState message="No hay productos registrados con los filtros aplicados" />
      ) : (
        <>
          <ProductTable products={products} sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} onDeleteSuccess={handleDeleteSuccess} onDeleteSelected={handleDeleteSelected} />
          <InfiniteListFooter hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} onLoadMore={() => fetchNextPage()} productsLength={products.length} />
        </>
      )}
    </div>
  );
}
