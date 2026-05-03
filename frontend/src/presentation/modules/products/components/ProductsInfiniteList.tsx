'use client';

import { useInfiniteProducts } from '../hooks/useInfiniteProducts';
import { ProductTable } from './table/ProductTable';
import { Button } from '@/presentation/shared/components/ui/Button';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/EmptyState';

interface ProductsInfiniteListProps {
  maxPages?: number;
}

export function ProductsInfiniteList({ maxPages = 20 }: ProductsInfiniteListProps) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts(maxPages);

  const products = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <EmptyState
        message="Error al cargar productos"
        action={
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState message="No hay productos registrados" />
    );
  }

  return (
    <div className="space-y-4">
      <ProductTable products={products} />
      
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
    </div>
  );
}