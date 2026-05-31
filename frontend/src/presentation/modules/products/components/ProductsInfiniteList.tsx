'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { useInfiniteProducts } from '../hooks/useInfiniteProducts';
import { ProductTable } from './table/ProductTable';
import { productRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { useSort } from '@/presentation/shared/hooks/ui/useSort';
import { InfiniteListFooter } from './InfiniteListFooter';

interface ProductsInfiniteListProps {
  maxPages?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  unitOfMeasure?: string;
}

export function ProductsInfiniteList({ maxPages = 20, search, categoryId, status, minPrice, maxPrice, unitOfMeasure }: ProductsInfiniteListProps) {
  const { sortKey, sortDirection, handleSort } = useSort();
  const filterParams = { search, categoryId, status, minPrice, maxPrice, unitOfMeasure, sortBy: sortKey, sortAsc: sortDirection === 'asc' };
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteProducts({ maxPages, ...filterParams });
  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const handleDeleteSuccess = useCallback(() => refetch(), [refetch]);
  const handleDeleteSelected = useCallback(async (ids: string[]) => {
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
