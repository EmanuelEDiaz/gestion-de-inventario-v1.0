import type { IExportRepository, ExportFilter } from '../../interfaces/IExportRepository';

export class ExportInventoryUseCase {
  constructor(private repository: IExportRepository) {}
  async execute(filter: ExportFilter): Promise<Blob> {
    return this.repository.exportInventory(filter);
  }
}
