'use client';

import { useState, useEffect } from 'react';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Search, X } from '@/presentation/shared/components/ui/icon-mapping';
import { Input } from '@/presentation/shared/components/ui';
import { useDebounce } from '@/presentation/shared/hooks/ui/useDebounce';

interface SearchBarProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({
  initialValue = '',
  onSearch,
  placeholder = 'Buscar...',
  debounceMs = 300,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
      {value && (
        <TooltipWrapper content="Limpiar búsqueda" side="top">
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </TooltipWrapper>
      )}
    </div>
  );
}
