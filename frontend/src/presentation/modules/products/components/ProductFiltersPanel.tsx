'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';
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

const UNIT_OPTIONS: { value: UnitOfMeasure; label: string }[] = [
  { value: 'UNIT', label: 'Unidad' },
  { value: 'KG', label: 'Kilogramo' },
  { value: 'L', label: 'Litro' },
  { value: 'M', label: 'Metro' },
  { value: 'M2', label: 'Metro²' },
  { value: 'BOX', label: 'Caja' },
  { value: 'PACK', label: 'Paquete' },
];

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'ARCHIVED', label: 'Archivado' },
];

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

  const clearFilters = () => {
    onChange(initialFilters);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
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
        <div className="rounded-lg border bg-white p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Categoría
              </label>
              <ComboboxSelect
                options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                value={filters.categoryId}
                onChange={(val) => handleFilterChange('categoryId', val)}
                placeholder="Todas las categorías"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Estado
              </label>
              <ComboboxSelect
                options={STATUS_OPTIONS}
                value={filters.status}
                onChange={(val) => handleFilterChange('status', val)}
                placeholder="Todos los estados"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Unidad de Medida
              </label>
              <ComboboxSelect
                options={UNIT_OPTIONS}
                value={filters.unitOfMeasure}
                onChange={(val) => handleFilterChange('unitOfMeasure', val)}
                placeholder="Todas"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Rango de Precio
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}