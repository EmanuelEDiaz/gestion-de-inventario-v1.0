import type { DashboardStats, LowStockItem } from '@/core/entities/dashboard';
import type { IDashboardRepository } from '@/core/interfaces/IDashboardRepository';

export class GetDashboardStatsUseCase {
  constructor(private repository: IDashboardRepository) {}
  async execute(): Promise<DashboardStats> {
    return this.repository.getStats();
  }
}

export class GetLowStockItemsUseCase {
  constructor(private repository: IDashboardRepository) {}
  async execute(): Promise<LowStockItem[]> {
    return this.repository.getLowStockItems();
  }
}
