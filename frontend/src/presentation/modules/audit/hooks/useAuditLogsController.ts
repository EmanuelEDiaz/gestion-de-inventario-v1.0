import { useState, useCallback, useEffect } from 'react';
import type { AuditLogEntry, AuditLogFilter } from '@/core/audit/entities/audit-log';
import { auditLogRepository } from '@/infrastructure/repositories/audit/AuditLogRepository';

const DEFAULT_FILTER: AuditLogFilter = { page: 0, size: 20 };
const POLL_INTERVAL = 30000;

export function useAuditLogsController() {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AuditLogFilter>(DEFAULT_FILTER);
  const [detailItem, setDetailItem] = useState<AuditLogEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchLogs = useCallback(async (f: AuditLogFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await auditLogRepository.list(f);
      setItems(result.items);
      setTotal(result.total);
    } catch (e) {
      setError('Error al cargar registros de auditoría');
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(filter);
    const interval = setInterval(() => fetchLogs(filter), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [filter, fetchLogs]);

  const openDetail = useCallback((entry: AuditLogEntry) => {
    setDetailItem(entry);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setDetailItem(null);
  }, []);

  const updateFilter = useCallback((partial: Partial<AuditLogFilter>) => {
    setFilter(prev => ({ ...prev, ...partial, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilter(prev => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    if ((filter.page + 1) * filter.size < total) {
      setFilter(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [filter.page, filter.size, total]);

  const prevPage = useCallback(() => {
    if (filter.page > 0) {
      setFilter(prev => ({ ...prev, page: prev.page - 1 }));
    }
  }, [filter.page]);

  const totalPages = Math.max(1, Math.ceil(total / filter.size));

  return {
    items,
    total,
    isLoading,
    error,
    filter,
    detailItem,
    isDetailOpen,
    openDetail,
    closeDetail,
    updateFilter,
    setPage,
    nextPage,
    prevPage,
    page: filter.page,
    totalPages,
    refresh: () => fetchLogs(filter),
    clearError: () => setError(null),
  };
}
