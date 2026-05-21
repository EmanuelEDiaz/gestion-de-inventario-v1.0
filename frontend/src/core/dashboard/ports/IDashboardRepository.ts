import type { DashboardStats, LowStockItem } from '@/core/dashboard/entities/dashboard';

export interface IDashboardRepository {
  getStats(): Promise<DashboardStats>;
  getLowStockItems(): Promise<LowStockItem[]>;
}
