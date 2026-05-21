import { useState, useCallback } from 'react';

export function useTableSelection(allIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === allIds.length ? new Set() : new Set(allIds)
    );
  }, [allIds]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return {
    selectedIds,
    toggleOne,
    toggleAll,
    clearSelection,
    isAllSelected: allIds.length > 0 && selectedIds.size === allIds.length,
    isIndeterminate: selectedIds.size > 0 && selectedIds.size < allIds.length,
  };
}
