import type { IReportRepository, InventoryReport, InventoryReportFilter } from '../ports/IReportRepository';

export class GetInventoryReportUseCase {
  constructor(private repository: IReportRepository) {}
  async execute(filter?: InventoryReportFilter): Promise<InventoryReport> {
    return this.repository.getInventoryReport(filter);
  }
}
