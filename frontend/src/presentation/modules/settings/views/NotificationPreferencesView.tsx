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
        />
        <PreferenceToggle
          checked={preferences.toastEnabled}
          onChange={() => toggleDeliveryChannel('toastEnabled')}
          disabled={isPending}
          label="Notificaciones en la UI (Toast)"
        />
        <PreferenceToggle
          checked={preferences.pushEnabled}
          onChange={() => toggleDeliveryChannel('pushEnabled')}
          disabled={isPending}
          label="Notificaciones Push (PWA)"
        />
      </PreferenceSection>

      <PreferenceSection title="Grupos de Notificaciones">
        <PreferenceToggle
          checked={preferences.inventoryEnabled}
          onChange={() => toggleCategory('inventoryEnabled')}
          disabled={isPending}
          label="Inventario (Stock Bajo)"
        />
        <PreferenceToggle
          checked={preferences.syncEnabled}
          onChange={() => toggleCategory('syncEnabled')}
          disabled={isPending}
          label="Sincronización"
        />
        <PreferenceToggle
          checked={preferences.operationsEnabled}
          onChange={() => toggleCategory('operationsEnabled')}
          disabled={isPending}
          label="Operaciones (Compras/Ventas)"
        />
        <PreferenceToggle
          checked={preferences.creditEnabled}
          onChange={() => toggleCategory('creditEnabled')}
          disabled={isPending}
          label="Crédito"
        />
        <PreferenceToggle
          checked={preferences.userActionsEnabled}
          onChange={() => toggleCategory('userActionsEnabled')}
          disabled={isPending}
          label="Acciones de Usuarios"
        />
        <PreferenceToggle
          checked={preferences.systemEnabled}
          onChange={() => toggleCategory('systemEnabled')}
          disabled={isPending}
          label="Sistema"
        />
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
