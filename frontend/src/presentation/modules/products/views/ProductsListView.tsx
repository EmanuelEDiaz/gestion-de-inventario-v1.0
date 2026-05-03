/**
 * ProductsListView - Composition view for products list page
 * Views only compose components, no logic
 */

'use client';

import Link from 'next/link';
import { Button } from '@/presentation/shared/components/ui';
import { PageHeader } from '@/presentation/shared/components/PageHeader';
import { ProductSearchBar } from '../components/filters/ProductSearchBar';
import { ProductsInfiniteList } from '../components/ProductsInfiniteList';
import { useSettingsController } from '@/presentation/modules/settings/hooks/useSettingsController';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';

const DEFAULT_MAX_PAGES = 20;

export function ProductsListView() {
  const { settings, isLoading } = useSettingsController();
  const maxPages = settings?.maxProductPages ?? DEFAULT_MAX_PAGES;

  if (isLoading) {
    return <LoadingSpinner />;
  }

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

      <ProductSearchBar onSearch={() => {}} />

      <ProductsInfiniteList maxPages={maxPages} />
    </div>
  );
}