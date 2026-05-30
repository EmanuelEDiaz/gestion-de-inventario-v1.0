import type { SalesTimelinePoint, TopProductEntry, TopCustomerEntry, ProfitSummary, InventoryValue } from '@/core/dashboard/entities/recharts-types';

export interface IDashboardMetricsRepository {
  getSalesTimeline(fromDate?: string, toDate?: string, granularity?: string): Promise<SalesTimelinePoint[]>;
  getTopProducts(fromDate?: string, toDate?: string, limit?: number): Promise<TopProductEntry[]>;
  getTopCustomers(fromDate?: string, toDate?: string, limit?: number): Promise<TopCustomerEntry[]>;
  getProfitSummary(fromDate?: string, toDate?: string): Promise<ProfitSummary>;
  getInventoryValue(): Promise<InventoryValue>;
}
