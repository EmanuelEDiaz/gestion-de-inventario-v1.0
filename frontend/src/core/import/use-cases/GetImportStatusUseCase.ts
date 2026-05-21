import type { IImportRepository } from '../ports/IImportRepository';
import type { ImportJob } from '../entities/import-job';

export class GetImportStatusUseCase {
  constructor(private repository: IImportRepository) {}
  async execute(id: string): Promise<ImportJob> {
    return this.repository.getStatus(id);
  }
}
