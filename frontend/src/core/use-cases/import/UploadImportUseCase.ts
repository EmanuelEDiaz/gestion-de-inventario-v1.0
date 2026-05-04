import type { IImportRepository } from '../../interfaces/IImportRepository';
import type { ImportJob } from '../../entities/import-job';

export class UploadImportUseCase {
  constructor(private repository: IImportRepository) {}
  async execute(file: File, mapping: Record<string, string>): Promise<ImportJob> {
    return this.repository.uploadCsv(file, mapping);
  }
}
