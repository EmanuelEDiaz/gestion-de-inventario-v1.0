'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import type { AuditLogEntry, AuditLogFilter } from '@/core/audit/entities/audit-log';
import { auditLogRepository } from '@/infrastructure/repositories/audit/AuditLogRepository';

const DEFAULT_FILTER: AuditLogFilter = { page: 0, size: 20 };

export function useAuditLogsController() {
  const [filter, setFilter] = useState<AuditLogFilter>(DEFAULT_FILTER);
  const [detailItem, setDetailItem] = useState<AuditLogEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', filter],
    queryFn: () => auditLogRepository.list(filter),
    staleTime: 1000 * 30,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filter.size));

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

  return {
    items,
    total,
    isLoading,
    error: error ? 'Error al cargar registros de auditoría' : null,
    filter,
    detailItem,
    isDetailOpen,
    openDetail,
    closeDetail,
    updateFilter,
    setPage,
    page: filter.page,
    totalPages,
    pageSize: filter.size,
    refresh: () => refetch(),
    clearError: () => {},
  };
}
