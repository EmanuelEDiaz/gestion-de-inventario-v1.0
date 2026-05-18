'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/presentation/shared/lib/utils';
import { ComboboxButton } from './ComboboxButton';
import { ComboboxDropdown } from './ComboboxDropdown';

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
  options, value, onChange, placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...', disabled = false, className, emptyMessage = 'Sin resultados',
}: ComboboxSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsKey = useMemo(() => options.map(o => o.value).join(','), [options]);

  const selectedOption = useMemo(() => options.find((opt) => opt.value === value), [options, value]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lowerSearch));
  }, [options, search]);

  useEffect(() => {
    if (value && !options.find((opt) => opt.value === value)) onChange('');
  }, [optionsKey, value, onChange]);

  useEffect(() => {
    if (isOpen && containerRef.current) containerRef.current.querySelector('input')?.focus();
  }, [options.length, isOpen]);

  useEffect(() => { if (!isOpen) setSearch(''); }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    const opt = options.find((o) => o.value === optionValue);
    if (opt?.disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <ComboboxButton selectedOption={selectedOption} placeholder={placeholder}
        isOpen={isOpen} disabled={disabled}
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }} />
      {isOpen && (
        <ComboboxDropdown search={search} onSearch={setSearch}
          searchPlaceholder={searchPlaceholder} filteredOptions={filteredOptions}
          value={value} onSelect={handleSelect} emptyMessage={emptyMessage}
          optionsKey={optionsKey} />
      )}
    </div>
  );
}
