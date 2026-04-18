/**
 * ProductsListView - Composition view for products list page
 * Views only compose components, no logic
 */

'use client';

import Link from 'next/link';
import { Button } from '@/presentation/shared/components/ui';
import { PageHeader } from '@/presentation/shared/components/PageHeader';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { LoadingOverlay } from '@/presentation/shared/components/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/EmptyState';
import { ProductTable } from '../components/table/ProductTable';
import { ProductSearchBar } from '../components/filters/ProductSearchBar';
import { useProductsController } from '../hooks/useProductsController';

export function ProductsListView() {
  const { products, isLoading, error, handleSearch, clearError } = useProductsController();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo de productos"
        actions={
          <Link href="/products/new">
            <Button>+ Nuevo Producto</Button>
          </Link>
        }
      />

      <ProductSearchBar onSearch={handleSearch} />

      {error && <AlertMessage message={error} onDismiss={clearError} />}

      {isLoading && <LoadingOverlay />}

      {!isLoading && (!products || products.length === 0) && (
        <EmptyState
          message="No hay productos registrados"
          action={
            <Link href="/products/new">
              <Button>Crear primer producto</Button>
            </Link>
          }
        />
      )}

      {!isLoading && products && products.length > 0 && <ProductTable products={products} />}
    </div>
  );
}
