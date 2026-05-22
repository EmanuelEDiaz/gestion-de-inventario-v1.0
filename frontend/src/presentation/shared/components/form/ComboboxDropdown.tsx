'use client';

import { useRef } from 'react';
import { Search, Check } from '@/presentation/shared/components/ui/icon-mapping';
import { cn } from '@/presentation/shared/lib/utils';

interface ComboboxDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ComboboxDropdownProps {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  filteredOptions: ComboboxDropdownOption[];
  value?: string;
  onSelect: (value: string) => void;
  emptyMessage: string;
  optionsKey: string;
}

export function ComboboxDropdown({
  search,
  onSearch,
  searchPlaceholder,
  filteredOptions,
  value,
  onSelect,
  emptyMessage,
  optionsKey,
}: ComboboxDropdownProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center border-b border-gray-100 px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1 border-0 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      <ul className="max-h-60 overflow-y-auto py-1" key={optionsKey}>
        {filteredOptions.length === 0 ? (
          <li className="px-4 py-3 text-sm text-gray-500">{emptyMessage}</li>
        ) : (
          filteredOptions.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => onSelect(option.value)}
                disabled={option.disabled}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2 text-left text-sm',
                  'hover:bg-gray-50',
                  option.disabled && 'cursor-not-allowed opacity-50',
                  option.value === value && 'bg-blue-50 hover:bg-blue-50'
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
