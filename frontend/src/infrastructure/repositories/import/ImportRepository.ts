import { apiClient } from '@/infrastructure/api/client';
import type { IImportRepository } from '@/core/import/ports/IImportRepository';
import type { ImportJob } from '@/core/import/entities/import-job';

export class ImportRepository implements IImportRepository {
  private readonly basePath = '/api/v1/imports';

  async uploadCsv(file: File, mapping: Record<string, string>): Promise<ImportJob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    const response = await apiClient.post<ImportJob>(`${this.basePath}/csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async dryRun(file: File, mapping: Record<string, string>): Promise<ImportJob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    const response = await apiClient.post<ImportJob>(`${this.basePath}/dry-run`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getStatus(id: string): Promise<ImportJob> {
    const response = await apiClient.get<ImportJob>(`${this.basePath}/${id}/status`);
    return response.data;
  }

  async getResult(id: string): Promise<ImportJob> {
    const response = await apiClient.get<ImportJob>(`${this.basePath}/${id}/result`);
    return response.data;
  }
}

export const importRepository = new ImportRepository();
