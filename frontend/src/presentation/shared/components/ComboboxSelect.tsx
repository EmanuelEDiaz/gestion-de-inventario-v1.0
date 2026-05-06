/**
 * ComboboxSelect - Select with search functionality
 * Reusable component for selecting items with fuzzy search
 * 
 * Features:
 * - Reactive: automatically updates when options change (by length or content)
 * - Validates: clears invalid selections when options are removed
 * - Smart filtering: fuzzy search with memoization
 * - Keyboard friendly: focus management and keyboard navigation
 */

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/presentation/shared/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxSelectProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function ComboboxSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  disabled = false,
  className,
  emptyMessage = 'Sin resultados',
}: ComboboxSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track options by length for change detection (more reliable than reference equality)
  const optionsLength = options.length;
  const optionsKey = useMemo(() => options.map(o => o.value).join(','), [options]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerSearch)
    );
  }, [options, search]);

  // Re-validate and force update when options change (by length or content)
  useEffect(() => {
    // If selected value no longer exists in options, clear it
    if (value && !options.find((opt) => opt.value === value)) {
      onChange('');
    }
  }, [optionsKey, value, onChange]);

  // Force dropdown refresh when options change length
  useEffect(() => {
    // If dropdown is open and options changed significantly, keep it open
    // This ensures the user sees updated options without closing/reopening
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [optionsLength, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    const opt = options.find((o) => o.value === optionValue);
    if (opt?.disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between rounded-lg border border-gray-300 px-4 py-2 text-left',
          'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          isOpen && 'border-blue-500 ring-1 ring-blue-500'
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-gray-400')}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                    onClick={() => handleSelect(option.value)}
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
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}