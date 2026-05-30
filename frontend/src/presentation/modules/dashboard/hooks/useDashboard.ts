'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardRepository } from '@/infrastructure/repositories/dashboard/DashboardRepository';

const repo = new DashboardRepository();

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => repo.getStats(),
  });
}

export function useDashboardLowStock() {
  return useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: () => repo.getLowStockItems(),
  });
}

export function useDashboard() {
  const statsQuery = useDashboardStats();
  const lowStockQuery = useDashboardLowStock();

  return {
    stats: statsQuery.data ?? null,
    lowStockItems: lowStockQuery.data ?? [],
    loading: statsQuery.isLoading || lowStockQuery.isLoading,
    error: statsQuery.error || lowStockQuery.error,
    refresh: () => {
      statsQuery.refetch();
      lowStockQuery.refetch();
    },
    errorMessage: statsQuery.error instanceof Error ? statsQuery.error.message : lowStockQuery.error instanceof Error ? lowStockQuery.error.message : null,
  };
}
