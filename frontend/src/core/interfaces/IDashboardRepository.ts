import type { DashboardStats, LowStockItem } from '@/core/entities/dashboard';

export interface IDashboardRepository {
  getStats(): Promise<DashboardStats>;
  getLowStockItems(): Promise<LowStockItem[]>;
}
