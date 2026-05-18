'use client';

import type { AppSettings, UpdateSettingsInput } from '@/core/entities/app-settings';
import { GeneralSettingsFields } from './GeneralSettingsFields';
import { NotificationSettingsFields } from './NotificationSettingsFields';

interface SettingsFormFieldsProps {
  settings: AppSettings;
  onSubmit: (data: { data: UpdateSettingsInput; version: number }) => void;
  isSubmitting: boolean;
}

export function SettingsFormFields({ settings, onSubmit, isSubmitting }: SettingsFormFieldsProps) {
  return (
    <div className="space-y-8">
      <GeneralSettingsFields settings={settings} onSubmit={onSubmit} isSubmitting={isSubmitting} />

      <hr className="border-border" />

      <NotificationSettingsFields />
    </div>
  );
}
