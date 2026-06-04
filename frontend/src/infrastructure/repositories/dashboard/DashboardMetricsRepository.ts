import { apiClient } from '@/infrastructure/api/client';
import type { IDashboardMetricsRepository } from '@/core/dashboard/ports/IDashboardMetricsRepository';
import type { SalesTimelinePoint, TopProductEntry, TopCustomerEntry, ProfitSummary, InventoryValue } from '@/core/dashboard/entities/recharts-types';

export class DashboardMetricsRepository implements IDashboardMetricsRepository {
  private qs(params: Record<string, string | undefined>, always: string[] = []): string {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) usp.set(k, v);
    }
    for (const k of always) {
      if (!usp.has(k)) usp.set(k, '');
    }
    const s = usp.toString();
    return s ? `?${s}` : '';
  }

  async getSalesTimeline(fromDate?: string, toDate?: string, granularity = 'month'): Promise<SalesTimelinePoint[]> {
    const response = await apiClient.get<SalesTimelinePoint[]>(
      `/api/v1/reports/sales-timeline${this.qs({ fromDate, toDate, granularity })}`
    );
    return response.data;
  }

  async getTopProducts(fromDate?: string, toDate?: string, limit = 10): Promise<TopProductEntry[]> {
    const response = await apiClient.get<TopProductEntry[]>(
      `/api/v1/reports/top-products${this.qs({ fromDate, toDate, limit: String(limit) })}`
    );
    return response.data;
  }

  async getTopCustomers(fromDate?: string, toDate?: string, limit = 10): Promise<TopCustomerEntry[]> {
    const response = await apiClient.get<TopCustomerEntry[]>(
      `/api/v1/reports/top-customers${this.qs({ fromDate, toDate, limit: String(limit) })}`
    );
    return response.data;
  }

  async getProfitSummary(fromDate?: string, toDate?: string): Promise<ProfitSummary> {
    const response = await apiClient.get<ProfitSummary>(
      `/api/v1/reports/profit-summary${this.qs({ fromDate, toDate })}`
    );
    return response.data;
  }

  async getInventoryValue(): Promise<InventoryValue> {
    const response = await apiClient.get<InventoryValue>('/api/v1/reports/inventory-value');
    return response.data;
  }
}
