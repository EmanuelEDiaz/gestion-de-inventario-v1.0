import { apiClient } from '@/presentation/shared/lib/api-client';
import type { ISettingsRepository } from '@/core/interfaces/ISettingsRepository';
import type { AppSettings, UpdateSettingsInput } from '@/core/entities/app-settings';

export class SettingsRepository implements ISettingsRepository {
  private readonly basePath = '/api/v1/settings';

  async get(): Promise<AppSettings> {
    const response = await apiClient.get<AppSettings>(this.basePath);
    return response.data;
  }

  async update(data: UpdateSettingsInput, version: number): Promise<AppSettings> {
    const response = await apiClient.patch<AppSettings>(this.basePath, data, {
      headers: { 'If-Match': `W/"${version}"` },
    });
    return response.data;
  }
}

export const settingsRepository = new SettingsRepository();
