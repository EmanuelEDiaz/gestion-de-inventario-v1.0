'use client';

import { Clock } from '@/presentation/shared/components/ui/icon-mapping';
import { useNotificationPreferences } from '@/presentation/shared/hooks';
import { PreferenceToggle } from '@/presentation/shared/components/feedback/PreferenceToggle';
import { PreferenceSection } from '@/presentation/shared/components/feedback/PreferenceSection';
import { ScheduleSelector } from '@/presentation/shared/components/feedback/ScheduleSelector';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { AlertMessage } from '@/presentation/shared/components/feedback/AlertMessage';

export function NotificationPreferencesView() {
  const {
    preferences, schedule, isLoading, isPending, updateErrorMessage,
    toggleCategory, toggleDeliveryChannel, updateQuietHours, toggleQuietHours,
    isCurrentlyInQuietHours,
  } = useNotificationPreferences({ enableInvalidation: true });

  if (isLoading) return <LoadingSpinner />;

  if (!preferences || !schedule) {
    return <AlertMessage variant="error" message="Error cargando preferencias de notificación" />;
  }

  return (
    <div className="space-y-6">
      {updateErrorMessage && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
          Error: {updateErrorMessage}
        </div>
      )}

      {isCurrentlyInQuietHours && (
        <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Actualmente en horario silencioso. Solo se entregarán notificaciones críticas.</span>
        </div>
      )}

      <PreferenceSection title="Canales de Entrega">
        <PreferenceToggle
          checked={preferences.sseEnabled}
          onChange={() => toggleDeliveryChannel('sseEnabled')}
          disabled={isPending}
          label="En Tiempo Real (SSE)"
          hint="Recibir notificaciones en tiempo real vía Server-Sent Events"
          hintDescription="Las notificaciones llegan sin necesidad de recargar la página ni hacer polling." />
        <PreferenceToggle
          checked={preferences.toastEnabled}
          onChange={() => toggleDeliveryChannel('toastEnabled')}
          disabled={isPending}
          label="Notificaciones en la UI (Toast)"
          hint="Mostrar notificaciones emergentes temporales en la interfaz de usuario" />
        <PreferenceToggle
          checked={preferences.pushEnabled}
          onChange={() => toggleDeliveryChannel('pushEnabled')}
          disabled={isPending}
          label="Notificaciones Push (PWA)"
          hint="Recibir notificaciones push incluso cuando la aplicación no está abierta"
          hintDescription="Requiere instalar la aplicación como PWA en tu dispositivo." />
      </PreferenceSection>

      <PreferenceSection title="Grupos de Notificaciones">
        <PreferenceToggle
          checked={preferences.inventoryEnabled}
          onChange={() => toggleCategory('inventoryEnabled')}
          disabled={isPending}
          label="Inventario (Stock Bajo)"
          hint="Alertas cuando productos alcanzan el umbral de stock bajo configurado" />
        <PreferenceToggle
          checked={preferences.syncEnabled}
          onChange={() => toggleCategory('syncEnabled')}
          disabled={isPending}
          label="Sincronización"
          hint="Notificaciones sobre el estado de la sincronización offline con el servidor" />
        <PreferenceToggle
          checked={preferences.operationsEnabled}
          onChange={() => toggleCategory('operationsEnabled')}
          disabled={isPending}
          label="Operaciones (Compras/Ventas)"
          hint="Alertas relacionadas con compras, ventas y movimientos de inventario" />
        <PreferenceToggle
          checked={preferences.creditEnabled}
          onChange={() => toggleCategory('creditEnabled')}
          disabled={isPending}
          label="Crédito"
          hint="Notificaciones sobre límites de crédito, cobros y estados de cuenta" />
        <PreferenceToggle
          checked={preferences.userActionsEnabled}
          onChange={() => toggleCategory('userActionsEnabled')}
          disabled={isPending}
          label="Acciones de Usuarios"
          hint="Alertas sobre actividades de usuarios como creaciones, modificaciones o eliminaciones" />
        <PreferenceToggle
          checked={preferences.systemEnabled}
          onChange={() => toggleCategory('systemEnabled')}
          disabled={isPending}
          label="Sistema"
          hint="Notificaciones del sistema como actualizaciones, mantenimiento o errores críticos" />
      </PreferenceSection>

      <PreferenceSection title="Horario Silencioso">
        <ScheduleSelector
          schedule={schedule}
          isPending={isPending}
          onToggleQuietHours={toggleQuietHours}
          onUpdateQuietHours={updateQuietHours}
        />
      </PreferenceSection>
    </div>
  );
}
