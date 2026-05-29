import type { SystemSetting, UpdateSystemSettingInput } from '../entities/system-setting';

export interface ISystemSettingsRepository {
  list(): Promise<SystemSetting[]>;
  update(key: string, input: UpdateSystemSettingInput): Promise<void>;
}
