import { apiClient } from '@/presentation/shared/lib/api-client';
import type {
  IReportRepository,
  DashboardReport,
  InventoryReport,
  SalesReportFilter,
  InventoryReportFilter,
} from '@/core/interfaces/IReportRepository';

export class ReportRepository implements IReportRepository {
  private readonly basePath = '/api/v1/reports';

  async getSalesReport(filter?: SalesReportFilter): Promise<DashboardReport> {
    const response = await apiClient.get<DashboardReport>(`${this.basePath}/sales`, {
      params: filter,
    });
    return response.data;
  }

  async getInventoryReport(filter?: InventoryReportFilter): Promise<InventoryReport> {
    const response = await apiClient.get<InventoryReport>(`${this.basePath}/inventory`, {
      params: filter,
    });
    return response.data;
  }
}

export const reportRepository = new ReportRepository();
