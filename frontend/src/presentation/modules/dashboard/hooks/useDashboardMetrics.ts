'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardMetricsRepository } from '@/infrastructure/repositories/dashboard/DashboardMetricsRepository';

const repo = new DashboardMetricsRepository();

export function useSalesTimeline(fromDate?: string, toDate?: string, granularity = 'month') {
  return useQuery({
    queryKey: ['sales-timeline', fromDate, toDate, granularity],
    queryFn: () => repo.getSalesTimeline(fromDate, toDate, granularity),
  });
}

export function useTopProducts(fromDate?: string, toDate?: string, limit = 10) {
  return useQuery({
    queryKey: ['top-products', fromDate, toDate, limit],
    queryFn: () => repo.getTopProducts(fromDate, toDate, limit),
  });
}

export function useTopCustomers(fromDate?: string, toDate?: string, limit = 10) {
  return useQuery({
    queryKey: ['top-customers', fromDate, toDate, limit],
    queryFn: () => repo.getTopCustomers(fromDate, toDate, limit),
  });
}

export function useProfitSummary(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['profit-summary', fromDate, toDate],
    queryFn: () => repo.getProfitSummary(fromDate, toDate),
  });
}

export function useInventoryValue() {
  return useQuery({
    queryKey: ['inventory-value'],
    queryFn: () => repo.getInventoryValue(),
  });
}

export function useDashboardMetrics() {
  const timeline = useSalesTimeline();
  const topProducts = useTopProducts();
  const topCustomers = useTopCustomers();
  const profitSummary = useProfitSummary();
  const inventoryValue = useInventoryValue();

  return {
    timeline: timeline.data ?? [],
    topProducts: topProducts.data ?? [],
    topCustomers: topCustomers.data ?? [],
    profitSummary: profitSummary.data,
    inventoryValue: inventoryValue.data,
    loading: timeline.isLoading || topProducts.isLoading || topCustomers.isLoading || profitSummary.isLoading || inventoryValue.isLoading,
    error: timeline.error || topProducts.error || topCustomers.error || profitSummary.error || inventoryValue.error,
  };
}
