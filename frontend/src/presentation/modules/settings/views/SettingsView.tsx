'use client';

import { useSettingsController } from '../hooks/useSettingsController';
import { useSystemSettingsController } from '../hooks/useSystemSettingsController';
import { SettingsFormFields } from '../components/form/SettingsFormFields';
import { NotificationPreferencesView } from './NotificationPreferencesView';
import { SystemSettingsView } from './SystemSettingsView';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/presentation/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';
import { useUser } from '@/presentation/shared/hooks/storage/useAuthStore';

export function SettingsView() {
  const user = useUser();
  const isAdmin = user?.role?.code === 'ADMIN';
  const { settings, isLoading, error, update, isUpdating } = useSettingsController();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage variant="error" message={error} />;
  if (!settings) return <AlertMessage variant="error" message="No se pudo cargar la configuración" />;

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
        {isAdmin && <TabsTrigger value="sistema">Sistema</TabsTrigger>}
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsFormFields settings={settings} onSubmit={update} isSubmitting={isUpdating} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notificaciones">
        <Card>
          <CardHeader>
            <CardTitle>Preferencias de Notificación</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesView />
          </CardContent>
        </Card>
      </TabsContent>

      {isAdmin && (
        <TabsContent value="sistema">
          <SystemSettingsView />
        </TabsContent>
      )}
    </Tabs>
  );
}
