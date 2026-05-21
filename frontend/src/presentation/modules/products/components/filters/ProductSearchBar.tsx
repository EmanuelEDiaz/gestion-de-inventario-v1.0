/**
 * ProductSearchBar - Search input for products with debounce
 */

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/presentation/shared/components/ui';
import { useDebounce } from '@/presentation/shared/hooks/ui/useDebounce';

interface ProductSearchBarProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function ProductSearchBar({
  initialValue = '',
  onSearch,
  placeholder = 'Buscar productos...',
  debounceMs = 300,
}: ProductSearchBarProps) {
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
    <div className="flex gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-9 max-w-sm pr-8"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
