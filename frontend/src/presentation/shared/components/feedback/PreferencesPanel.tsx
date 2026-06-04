'use client';
import React, { useState } from 'react';
import { ArrowLeft, Save, Clock } from '@/presentation/shared/components/ui/icon-mapping';
import { useNotificationPreferences } from '@/presentation/shared/hooks';
import { PreferenceToggle } from './PreferenceToggle';
import { PreferenceSection } from './PreferenceSection';
import { ScheduleSelector } from './ScheduleSelector';
interface PreferencesPanelProps {
  onClose: () => void;
}

export function PreferencesPanel({ onClose }: PreferencesPanelProps) {
  const {
    preferences, schedule, isLoading, isPending, updateErrorMessage,
    toggleCategory, toggleDeliveryChannel, updateQuietHours, toggleQuietHours,
    isCurrentlyInQuietHours,
  } = useNotificationPreferences({ enableInvalidation: true });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSuccessMessage('Preferencias guardadas correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      import('@/infrastructure/logging/appLogger').then(m => m.appLogger.error('Error saving preferences', error));
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen md:h-96 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando preferencias...</p>
        </div>
      </div>
    );
  }

  if (!preferences || !schedule) {
    return (
      <div className="h-screen md:h-96 flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-danger">Error cargando preferencias</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen md:h-96 flex flex-col bg-white overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Preferencias</h2>
        </div>
      </div>

      {updateErrorMessage && <div className="mx-4 mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">Error: {updateErrorMessage}</div>}
      {successMessage && <div className="mx-4 mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-md">{successMessage}</div>}
      {isCurrentlyInQuietHours && (
        <div className="mx-4 mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-md flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Actualmente en horario silencioso. Solo se entregarán notificaciones críticas.</span>
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        <PreferenceSection title="Canales de Entrega">
          <PreferenceToggle checked={preferences.sseEnabled} onChange={() => toggleDeliveryChannel('sseEnabled')} disabled={isPending} label="En Tiempo Real (SSE)" />
          <PreferenceToggle checked={preferences.toastEnabled} onChange={() => toggleDeliveryChannel('toastEnabled')} disabled={isPending} label="Notificaciones en la UI (Toast)" />
          <PreferenceToggle checked={preferences.pushEnabled} onChange={() => toggleDeliveryChannel('pushEnabled')} disabled={isPending} label="Notificaciones Push (PWA)" />
        </PreferenceSection>

        <PreferenceSection title="Grupos de Notificaciones">
          <PreferenceToggle checked={preferences.inventoryEnabled} onChange={() => toggleCategory('inventoryEnabled')} disabled={isPending} label="Inventario (Stock Bajo)" />
          <PreferenceToggle checked={preferences.syncEnabled} onChange={() => toggleCategory('syncEnabled')} disabled={isPending} label="Sincronización" />
          <PreferenceToggle checked={preferences.operationsEnabled} onChange={() => toggleCategory('operationsEnabled')} disabled={isPending} label="Operaciones (Compras/Ventas)" />
          <PreferenceToggle checked={preferences.creditEnabled} onChange={() => toggleCategory('creditEnabled')} disabled={isPending} label="Crédito" />
          <PreferenceToggle checked={preferences.userActionsEnabled} onChange={() => toggleCategory('userActionsEnabled')} disabled={isPending} label="Acciones de Usuarios" />
          <PreferenceToggle checked={preferences.systemEnabled} onChange={() => toggleCategory('systemEnabled')} disabled={isPending} label="Sistema" />
        </PreferenceSection>

        <ScheduleSelector schedule={schedule} isPending={isPending} onToggleQuietHours={toggleQuietHours} onUpdateQuietHours={updateQuietHours} />
      </div>

      <div className="flex gap-2 px-4 py-3 border-t bg-gray-50 sticky bottom-0">
        <button onClick={onClose} disabled={isPending} className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors">Cerrar</button>
        <button onClick={handleSave} disabled={isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2">
          <Save className="h-4 w-4" />
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
