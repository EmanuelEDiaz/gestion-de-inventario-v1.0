'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import type { IGeoSearchAdapter } from '@/core/maps/ports/IGeoSearchAdapter';
import type { GeoEntry } from '@/core/maps/entities/map-location';
import { cn } from '@/presentation/shared/lib/utils';

interface GeoSearchInputProps {
  searchAdapter: IGeoSearchAdapter;
  province?: string;
  municipality?: string;
  onSelect: (entry: GeoEntry) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function GeoSearchInput({
  searchAdapter,
  province,
  municipality,
  onSelect,
  placeholder = 'Buscar lugar...',
  disabled = false,
}: GeoSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !searchAdapter.isLoaded()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const items = await searchAdapter.search(q, 15, { province, municipality });
      setResults(items);
      setIsOpen(items.length > 0);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchAdapter, province, municipality]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => doSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (entry: GeoEntry) => {
    setQuery(entry.name);
    setIsOpen(false);
    onSelect(entry);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full h-11 pl-10 pr-4 rounded-lg border bg-background',
            'text-sm placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-[2000] bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((entry, i) => (
            <button
              key={entry.id}
              onClick={() => handleSelect(entry)}
              className={cn(
                'w-full flex items-start gap-3 px-3 py-2 text-left text-sm',
                'hover:bg-accent transition-colors',
                i === selectedIndex && 'bg-accent'
              )}
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="font-medium truncate">{entry.name}</div>
                {entry.parentName && (
                  <div className="text-xs text-muted-foreground truncate">{entry.parentName}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
