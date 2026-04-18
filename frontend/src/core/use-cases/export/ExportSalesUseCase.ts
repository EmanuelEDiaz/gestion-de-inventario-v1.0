import type { IExportRepository, ExportFilter } from '../../interfaces/IExportRepository';

export class ExportSalesUseCase {
  constructor(private repository: IExportRepository) {}
  async execute(filter: ExportFilter): Promise<Blob> {
    return this.repository.exportSales(filter);
  }
}
