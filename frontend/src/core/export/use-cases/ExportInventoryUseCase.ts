import type { IExportRepository, ExportFilter } from '../ports/IExportRepository';

export class ExportInventoryUseCase {
  constructor(private repository: IExportRepository) {}
  async execute(filter: ExportFilter): Promise<Blob> {
    return this.repository.exportInventory(filter);
  }
}
