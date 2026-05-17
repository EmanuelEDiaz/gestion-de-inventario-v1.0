import { apiClient } from '@/infrastructure/api/client';
import type { IExportRepository, ExportFilter } from '@/core/interfaces/IExportRepository';

export class ExportRepository implements IExportRepository {
  private readonly basePath = '/api/v1/exports';

  async exportSales(filter: ExportFilter): Promise<Blob> {
    const response = await apiClient.get(`${this.basePath}/sales`, {
      params: filter,
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  async exportInventory(filter: ExportFilter): Promise<Blob> {
    const response = await apiClient.get(`${this.basePath}/inventory`, {
      params: filter,
      responseType: 'blob',
    });
    return response.data as Blob;
  }
}

export const exportRepository = new ExportRepository();
