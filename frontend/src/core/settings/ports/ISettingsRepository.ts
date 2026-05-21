import type { AppSettings, UpdateSettingsInput } from '../entities/app-settings';

export interface ISettingsRepository {
  get(): Promise<AppSettings>;
  update(data: UpdateSettingsInput, version: number): Promise<AppSettings>;
}
