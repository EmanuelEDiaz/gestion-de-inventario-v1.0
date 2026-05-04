import type { ISettingsRepository } from '../../interfaces/ISettingsRepository';
import type { AppSettings } from '../../entities/app-settings';

export class GetSettingsUseCase {
  constructor(private repository: ISettingsRepository) {}
  async execute(): Promise<AppSettings> {
    return this.repository.get();
  }
}
