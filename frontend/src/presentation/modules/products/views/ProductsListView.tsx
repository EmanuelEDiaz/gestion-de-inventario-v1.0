/**
 * ProductsListView - Composition view for products list page
 * Views only compose components, no logic
 */

'use client';

import Link from 'next/link';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Button } from '@/presentation/shared/components/ui';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { ProductsInfiniteList } from '../components/ProductsInfiniteList';
import { DEFAULT_UI_PREFS } from '@/core/settings/entities/app-settings';

const DEFAULT_MAX_PAGES = DEFAULT_UI_PREFS.maxProductPages;

export function ProductsListView() {

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo de productos"
        actions={
          <TooltipWrapper content="Crear nuevo producto" side="top">
            <Link href="/products/new">
              <Button>+ Nuevo Producto</Button>
            </Link>
          </TooltipWrapper>
        }
      />

      <ProductsInfiniteList maxPages={DEFAULT_MAX_PAGES} />
    </div>
  );
}