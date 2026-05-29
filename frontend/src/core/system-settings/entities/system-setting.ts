export interface SystemSetting {
  key: string;
  value: string;
  valueType: 'integer' | 'boolean' | 'string' | 'cron';
  description: string;
  isPublic: boolean;
  updatedAt: string;
}

export interface UpdateSystemSettingInput {
  value: string;
}
