export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ExportFilter {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  format: ExportFormat;
}

export interface IExportRepository {
  exportSales(filter: ExportFilter): Promise<Blob>;
  exportInventory(filter: ExportFilter): Promise<Blob>;
}
