'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Button } from '@/presentation/shared/components/ui';
import { PageHeader } from '@/presentation/shared/components/data-display/PageHeader';
import { FilterBar } from '@/presentation/shared/components/ui/FilterBar';
import type { FilterDef } from '@/presentation/shared/components/ui/FilterBar';
import { ProductsInfiniteList } from '../components/ProductsInfiniteList';
import { useCategories } from '../hooks/useCategories';
import { DEFAULT_UI_PREFS } from '@/core/settings/entities/app-settings';

const DEFAULT_MAX_PAGES = DEFAULT_UI_PREFS.maxProductPages;

export function ProductsListView() {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { data: categories, isLoading: isLoadingCategories } = useCategories(true);

  const filterDefs: FilterDef[] = useMemo(() => [
    { key: 'categoryId', label: 'Categoría', type: 'async-select' as const,
      options: (categories ?? []).map((c) => ({ value: c.id, label: c.name })),
      placeholder: 'Todas las categorías' },
    { key: 'status', label: 'Estado', type: 'select' as const,
      options: [
        { value: 'ACTIVE', label: 'Activo' },
        { value: 'ARCHIVED', label: 'Archivado' },
      ] },
    { key: 'unitOfMeasure', label: 'Unidad de Medida', type: 'select' as const,
      options: [
        { value: 'UNIT', label: 'Unidad' },
        { value: 'KG', label: 'Kilogramo' },
        { value: 'L', label: 'Litro' },
        { value: 'M', label: 'Metro' },
        { value: 'M2', label: 'Metro²' },
        { value: 'BOX', label: 'Caja' },
        { value: 'PACK', label: 'Paquete' },
      ] },
    { key: 'priceRange', label: 'Rango de Precio', type: 'range' as const,
      minKey: 'minPrice', maxKey: 'maxPrice' },
  ], [categories]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filterParams = useMemo(() => ({
    search: search || undefined,
    categoryId: filterValues.categoryId || undefined,
    status: filterValues.status || undefined,
    minPrice: filterValues.minPrice ? parseFloat(filterValues.minPrice) : undefined,
    maxPrice: filterValues.maxPrice ? parseFloat(filterValues.maxPrice) : undefined,
    unitOfMeasure: filterValues.unitOfMeasure || undefined,
  }), [search, filterValues]);

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

      <FilterBar
        searchPlaceholder="Buscar por nombre, SKU o código de barras..."
        onSearch={setSearch}
        filters={isLoadingCategories ? undefined : filterDefs}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
      />

      <ProductsInfiniteList maxPages={DEFAULT_MAX_PAGES} search={filterParams.search}
        categoryId={filterParams.categoryId} status={filterParams.status}
        minPrice={filterParams.minPrice} maxPrice={filterParams.maxPrice}
        unitOfMeasure={filterParams.unitOfMeasure} />
    </div>
  );
}