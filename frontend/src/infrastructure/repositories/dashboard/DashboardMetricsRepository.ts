import { apiClient } from '@/infrastructure/api/client';
import type { IDashboardMetricsRepository } from '@/core/dashboard/ports/IDashboardMetricsRepository';
import type { SalesTimelinePoint, TopProductEntry, TopCustomerEntry, ProfitSummary, InventoryValue } from '@/core/dashboard/entities/recharts-types';

export class DashboardMetricsRepository implements IDashboardMetricsRepository {
  async getSalesTimeline(fromDate?: string, toDate?: string, granularity = 'month'): Promise<SalesTimelinePoint[]> {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    params.set('granularity', granularity);
    const response = await apiClient.get<SalesTimelinePoint[]>(`/api/v1/reports/sales-timeline?${params}`);
    return response.data;
  }

  async getTopProducts(fromDate?: string, toDate?: string, limit = 10): Promise<TopProductEntry[]> {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    params.set('limit', String(limit));
    const response = await apiClient.get<TopProductEntry[]>(`/api/v1/reports/top-products?${params}`);
    return response.data;
  }

  async getTopCustomers(fromDate?: string, toDate?: string, limit = 10): Promise<TopCustomerEntry[]> {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    params.set('limit', String(limit));
    const response = await apiClient.get<TopCustomerEntry[]>(`/api/v1/reports/top-customers?${params}`);
    return response.data;
  }

  async getProfitSummary(fromDate?: string, toDate?: string): Promise<ProfitSummary> {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    const response = await apiClient.get<ProfitSummary>(`/api/v1/reports/profit-summary?${params}`);
    return response.data;
  }

  async getInventoryValue(): Promise<InventoryValue> {
    const response = await apiClient.get<InventoryValue>('/api/v1/reports/inventory-value');
    return response.data;
  }
}
