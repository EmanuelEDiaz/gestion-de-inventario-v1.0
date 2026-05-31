'use client';

import { useState } from 'react';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import {
  ChevronDown, ChevronUp, Filter, X,
} from '@/presentation/shared/components/ui/icon-mapping';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { Input } from '@/presentation/shared/components/ui/Input';
import { SearchBar } from '@/presentation/shared/components/ui/SearchBar';

export interface FilterDef {
  key: string;
  label: string;
  type: 'select' | 'text' | 'range' | 'async-select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  minKey?: string;
  maxKey?: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearch: (value: string) => void;
  filters?: FilterDef[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
}

const initialRecord: Record<string, string> = {};

export function FilterBar({
  searchPlaceholder = 'Buscar...',
  onSearch,
  filters,
  filterValues = initialRecord,
  onFilterChange,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = filters
    ? filters.filter((f) => {
        if (f.type === 'range') {
          const min = filterValues[f.minKey ?? ''] ?? '';
          const max = filterValues[f.maxKey ?? ''] ?? '';
          return min !== '' || max !== '';
        }
        return (filterValues[f.key] ?? '') !== '';
      }).length
    : 0;

  const clearAll = () => {
    if (!onFilterChange || !filters) return;
    for (const f of filters) {
      onFilterChange(f.key, '');
      if (f.type === 'range' && f.minKey) onFilterChange(f.minKey, '');
      if (f.type === 'range' && f.maxKey) onFilterChange(f.maxKey, '');
    }
  };

  const hasFilters = filters && filters.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar placeholder={searchPlaceholder} onSearch={onSearch} />
        {hasFilters && (
          <div className="flex items-center gap-2">
            <TooltipWrapper content="Abrir/cerrar panel de filtros" side="top">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {activeCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                    {activeCount}
                  </Badge>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </TooltipWrapper>
            {activeCount > 0 && (
              <TooltipWrapper content="Limpiar todos los filtros" side="top">
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              </TooltipWrapper>
            )}
          </div>
        )}
      </div>

      {hasFilters && isOpen && (
        <div className="rounded-lg border bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filters.map((f) => {
              if (f.type === 'range') {
                const minVal = filterValues[f.minKey ?? ''] ?? '';
                const maxVal = filterValues[f.maxKey ?? ''] ?? '';
                return (
                  <div key={f.key}>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">{f.label}</label>
                    <div className="flex items-center gap-2">
                      <Input type="number" placeholder="Min" value={minVal}
                        onChange={(e) => onFilterChange?.(f.minKey ?? '', e.target.value)} />
                      <span className="text-gray-400">-</span>
                      <Input type="number" placeholder="Max" value={maxVal}
                        onChange={(e) => onFilterChange?.(f.maxKey ?? '', e.target.value)} />
                    </div>
                  </div>
                );
              }

              const val = filterValues[f.key] ?? '';
              return (
                <div key={f.key}>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">{f.label}</label>
                  <ComboboxSelect
                    options={f.options ?? []}
                    value={val}
                    onChange={(v) => onFilterChange?.(f.key, v)}
                    placeholder={f.placeholder ?? `Todos`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
