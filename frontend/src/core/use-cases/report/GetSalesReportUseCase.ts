import type { IReportRepository, DashboardReport, SalesReportFilter } from '../../interfaces/IReportRepository';

export class GetSalesReportUseCase {
  constructor(private repository: IReportRepository) {}
  async execute(filter?: SalesReportFilter): Promise<DashboardReport> {
    return this.repository.getSalesReport(filter);
  }
}
