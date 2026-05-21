'use client';

import { useSettingsController } from '../hooks/useSettingsController';
import { SettingsFormFields } from '../components/form/SettingsFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';

export function SettingsView() {
  const { settings, isLoading, error, update, isUpdating } = useSettingsController();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;
  if (!settings) return <AlertMessage variant="error" message="No se pudo cargar la configuración" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsFormFields
            settings={settings}
            onSubmit={update}
            isSubmitting={isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  );
}
