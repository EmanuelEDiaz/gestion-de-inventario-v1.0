import type { IExportRepository, ExportFilter } from '../ports/IExportRepository';

export class ExportSalesUseCase {
  constructor(private repository: IExportRepository) {}
  async execute(filter: ExportFilter): Promise<Blob> {
    return this.repository.exportSales(filter);
  }
}
