import type { ImportJob } from '../entities/import-job';

export interface IImportRepository {
  uploadCsv(file: File, mapping: Record<string, string>): Promise<ImportJob>;
  dryRun(file: File, mapping: Record<string, string>): Promise<ImportJob>;
  getStatus(id: string): Promise<ImportJob>;
  getResult(id: string): Promise<ImportJob>;
}
