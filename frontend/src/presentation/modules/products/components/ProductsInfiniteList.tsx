'use client';

import { useCallback } from 'react';
import { toast } from '@/presentation/shared/components/ui';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { usePaginatedProducts } from '../hooks/usePaginatedProducts';
import type { ProductStatus, UnitOfMeasure } from '@/core/product/entities/product';
import { ProductTable } from './table/ProductTable';
import { productRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';

interface ProductsInfiniteListProps {
  maxPages?: number;
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  unitOfMeasure?: UnitOfMeasure;
}

export function ProductsInfiniteList({ search, categoryId, status, minPrice, maxPrice, unitOfMeasure }: ProductsInfiniteListProps) {
  const { products, totalElements, totalPages, page, setPage, isLoading, isError, refetch, pageSize } = usePaginatedProducts({
    search, categoryId, status, minPrice, maxPrice, unitOfMeasure,
  });

  const handleDeleteSuccess = useCallback(() => refetch(), [refetch]);
  const handleDeleteSelected = useCallback(async (ids: string[]) => {
    try {
      await productRepository.deleteAll(ids);
      toast.success('Productos eliminados correctamente');
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
        <ProductTable
          products={products}
          onDeleteSuccess={handleDeleteSuccess}
          onDeleteSelected={handleDeleteSelected}
          pagination={{
            page,
            totalPages,
            totalElements,
            pageSize,
            onPageChange: setPage,
          }}
        />
      )}
    </div>
  );
}
