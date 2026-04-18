import type { IReportRepository, InventoryReport, InventoryReportFilter } from '../../interfaces/IReportRepository';

export class GetInventoryReportUseCase {
  constructor(private repository: IReportRepository) {}
  async execute(filter?: InventoryReportFilter): Promise<InventoryReport> {
    return this.repository.getInventoryReport(filter);
  }
}
