import type { ISettingsRepository } from '../../interfaces/ISettingsRepository';
import type { AppSettings, UpdateSettingsInput } from '../../entities/app-settings';

export class UpdateSettingsUseCase {
  constructor(private repository: ISettingsRepository) {}
  async execute(data: UpdateSettingsInput, version: number): Promise<AppSettings> {
    return this.repository.update(data, version);
  }
}
