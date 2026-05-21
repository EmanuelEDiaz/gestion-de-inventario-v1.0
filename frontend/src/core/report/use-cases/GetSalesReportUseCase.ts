import type { IReportRepository, DashboardReport, SalesReportFilter } from '../ports/IReportRepository';

export class GetSalesReportUseCase {
  constructor(private repository: IReportRepository) {}
  async execute(filter?: SalesReportFilter): Promise<DashboardReport> {
    return this.repository.getSalesReport(filter);
  }
}
