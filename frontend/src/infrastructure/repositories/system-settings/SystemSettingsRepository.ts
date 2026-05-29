import { apiClient } from '@/infrastructure/api/client';
import type { ISystemSettingsRepository } from '@/core/system-settings/ports/ISystemSettingsRepository';
import type { SystemSetting, UpdateSystemSettingInput } from '@/core/system-settings/entities/system-setting';

export const systemSettingsRepository: ISystemSettingsRepository = {
  async list(): Promise<SystemSetting[]> {
    const { data } = await apiClient.get<SystemSetting[]>('/api/v1/settings/system');
    return data;
  },

  async update(key: string, input: UpdateSystemSettingInput): Promise<void> {
    await apiClient.put(`/api/v1/settings/system/${key}`, input);
  },
};
