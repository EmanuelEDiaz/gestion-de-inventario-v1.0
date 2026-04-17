/**
 * ProductSearchBar - Search input for products
 */

import { useState, useCallback } from 'react';
import { Input } from '@/presentation/shared/components/ui';

interface ProductSearchBarProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function ProductSearchBar({
  initialValue = '',
  onSearch,
  placeholder = 'Buscar productos...',
}: ProductSearchBarProps) {
  const [value, setValue] = useState(initialValue);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onSearch(value);
      }
    },
    [value, onSearch]
  );

  return (
    <div className="flex gap-2">
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="max-w-sm"
      />
    </div>
  );
}
