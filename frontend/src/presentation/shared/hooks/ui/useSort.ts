'use client';

import { useState, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

interface UseSortOptions {
  defaultSortKey?: string;
  defaultDirection?: SortDirection;
}

interface UseSortReturn {
  sortKey: string;
  sortDirection: SortDirection;
  handleSort: (key: string) => void;
  getSortParams: () => { sortBy: string; sortAsc: boolean };
}

export function useSort(options: UseSortOptions = {}): UseSortReturn {
  const { defaultSortKey = 'name', defaultDirection = 'asc' } = options;
  
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  const handleSort = useCallback((key: string) => {
    setSortKey((currentKey) => {
      if (currentKey === key) {
        setSortDirection((currentDir) => currentDir === 'asc' ? 'desc' : 'asc');
        return key;
      }
      setSortDirection(defaultDirection);
      return key;
    });
  }, [defaultDirection]);

  const getSortParams = useCallback(() => ({
    sortBy: sortKey,
    sortAsc: sortDirection === 'asc',
  }), [sortKey, sortDirection]);

  return {
    sortKey,
    sortDirection,
    handleSort,
    getSortParams,
  };
}