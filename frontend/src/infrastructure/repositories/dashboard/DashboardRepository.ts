import { apiClient } from '@/infrastructure/api/client';
import type { IDashboardRepository } from '@/core/dashboard/ports/IDashboardRepository';
import type { DashboardStats, LowStockItem } from '@/core/dashboard/entities/dashboard';

export class DashboardRepository implements IDashboardRepository {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/api/v1/dashboard/stats');
    return response.data;
  }

  async getLowStockItems(): Promise<LowStockItem[]> {
    const response = await apiClient.get<LowStockItem[]>('/api/v1/dashboard/low-stock');
    return response.data;
  }
}
