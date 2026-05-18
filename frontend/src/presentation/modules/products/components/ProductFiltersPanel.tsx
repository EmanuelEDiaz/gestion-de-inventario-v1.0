'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { CategoryFilter } from './filters/CategoryFilter';
import { StatusFilter } from './filters/StatusFilter';
import { UnitFilter } from './filters/UnitFilter';
import { PriceRangeFilter } from './filters/PriceRangeFilter';
import type { Category } from '@/core/entities/category';
import type { ProductStatus, UnitOfMeasure } from '@/core/entities/product';

export interface ProductFiltersState {
  search: string;
  categoryId: string;
  status: ProductStatus | '';
  minPrice: string;
  maxPrice: string;
  unitOfMeasure: UnitOfMeasure | '';
}

interface ProductFiltersPanelProps {
  filters: ProductFiltersState;
  onChange: (filters: ProductFiltersState) => void;
  categories: Category[];
}

const initialFilters: ProductFiltersState = {
  search: '',
  categoryId: '',
  status: '',
  minPrice: '',
  maxPrice: '',
  unitOfMeasure: '',
};

export function ProductFiltersPanel({ filters, onChange, categories }: ProductFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value.length > 0;
    return value !== '' && value !== null;
  }).length;

  const handleFilterChange = (key: keyof ProductFiltersState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => onChange(initialFilters);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0">
              {activeFiltersCount}
            </Badge>
          )}
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="rounded-lg border bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CategoryFilter
              categories={categories}
              value={filters.categoryId}
              onChange={(val) => handleFilterChange('categoryId', val)}
            />
            <StatusFilter
              value={filters.status}
              onChange={(val) => handleFilterChange('status', val)}
            />
            <UnitFilter
              value={filters.unitOfMeasure}
              onChange={(val) => handleFilterChange('unitOfMeasure', val)}
            />
            <PriceRangeFilter
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              onMinChange={(val) => handleFilterChange('minPrice', val)}
              onMaxChange={(val) => handleFilterChange('maxPrice', val)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
