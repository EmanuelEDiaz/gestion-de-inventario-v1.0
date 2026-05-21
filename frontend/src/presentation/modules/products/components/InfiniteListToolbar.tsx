'use client';

import type { Category } from '@/core/category/entities/category';
import type { ProductFiltersState } from './ProductFiltersPanel';
import { ProductSearchBar } from './filters/ProductSearchBar';
import { ProductFiltersPanel } from './ProductFiltersPanel';

interface InfiniteListToolbarProps {
  onSearch: (search: string) => void;
  placeholder: string;
  debounceMs: number;
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
  categories: Category[];
  isLoadingCategories: boolean;
}

export function InfiniteListToolbar({
  onSearch,
  placeholder,
  debounceMs,
  filters,
  onFiltersChange,
  categories,
  isLoadingCategories,
}: InfiniteListToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <ProductSearchBar
        onSearch={onSearch}
        placeholder={placeholder}
        debounceMs={debounceMs}
      />
      {!isLoadingCategories && categories.length > 0 && (
        <ProductFiltersPanel
          filters={filters}
          onChange={onFiltersChange}
          categories={categories}
        />
      )}
    </div>
  );
}
