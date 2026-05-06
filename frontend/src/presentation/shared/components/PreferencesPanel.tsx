/**
 * PreferencesPanel.tsx
 * 
 * Panel de preferencias y horarios silenciosos
 * - Toggles para 6 grupos de categorías
 * - Toggles para 3 canales de entrega
 * - Configuración de quiet hours
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import {
  NotificationPreferences,
  NotificationSchedule,
  UpdateNotificationPreferencesRequest,
  UpdateNotificationScheduleRequest,
} from '@/core/entities/notification';
import {
  getNotificationPreferences,
  getNotificationSchedule,
  updateNotificationPreferences,
  updateNotificationSchedule,
} from '@/infrastructure/api/notifications.api';

interface PreferencesPanelProps {
  onClose: () => void;
  token?: string;
}

export function PreferencesPanel({ onClose, token }: PreferencesPanelProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [schedule, setSchedule] = useState<NotificationSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [prefs, sched] = await Promise.all([
          getNotificationPreferences(token),
          getNotificationSchedule(token),
        ]);
        setPreferences(prefs);
        setSchedule(sched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando preferencias');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    if (preferences) {
      setPreferences({
        ...preferences,
        [key]: value,
      });
      setSuccessMessage(null);
    }
  };

  const handleScheduleChange = (
    key: keyof NotificationSchedule,
    value: string | boolean | number[]
  ) => {
    if (schedule) {
      setSchedule({
        ...schedule,
        [key]: value,
      });
      setSuccessMessage(null);
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const updates: UpdateNotificationPreferencesRequest = {
        enabled: preferences.enabled,
        lowStockEnabled: preferences.lowStockEnabled,
        syncEnabled: preferences.syncEnabled,
        operationsEnabled: preferences.operationsEnabled,
        debtEnabled: preferences.debtEnabled,
        userActionsEnabled: preferences.userActionsEnabled,
        systemEnabled: preferences.systemEnabled,
        pushNotificationsEnabled: preferences.pushNotificationsEnabled,
        toastNotificationsEnabled: preferences.toastNotificationsEnabled,
        sseEnabled: preferences.sseEnabled,
        soundEnabled: preferences.soundEnabled,
        desktopNotificationEnabled: preferences.desktopNotificationEnabled,
      };

      await updateNotificationPreferences(updates, token);
      setSuccessMessage('Preferencias guardadas correctamente');

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando preferencias');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!schedule) return;

    try {
      setIsSaving(true);
      const updates: UpdateNotificationScheduleRequest = {
        quietHoursStart: schedule.quietHoursStart,
        quietHoursEnd: schedule.quietHoursEnd,
        quietHoursEnabled: schedule.quietHoursEnabled,
        quietDaysList: schedule.quietDaysList,
        bypassOnCritical: schedule.bypassOnCritical,
      };

      await updateNotificationSchedule(updates, token);
      setSuccessMessage('Horarios guardados correctamente');

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando horarios');
    } finally {
      setIsSaving(false);
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
          <p className="text-red-600">Error cargando preferencias</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen md:h-96 flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Preferencias</h2>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mx-4 mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-md">
          {successMessage}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {/* Master Toggle */}
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={(e) => handlePreferenceChange('enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="font-semibold text-gray-900">Habilitar todas las notificaciones</span>
          </label>
        </div>

        {/* Delivery Channels */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-gray-900 text-sm">Canales de Entrega</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.sseEnabled}
              onChange={(e) => handlePreferenceChange('sseEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">En Tiempo Real (SSE)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.toastNotificationsEnabled}
              onChange={(e) => handlePreferenceChange('toastNotificationsEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Notificaciones en la UI</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.pushNotificationsEnabled}
              onChange={(e) => handlePreferenceChange('pushNotificationsEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Notificaciones Push (PWA)</span>
          </label>
        </div>

        {/* Category Groups */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-gray-900 text-sm">Grupos de Notificaciones</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.lowStockEnabled}
              onChange={(e) => handlePreferenceChange('lowStockEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Inventario (Stock Bajo)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.syncEnabled}
              onChange={(e) => handlePreferenceChange('syncEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Sincronización</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.operationsEnabled}
              onChange={(e) => handlePreferenceChange('operationsEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Operaciones (Compras/Ventas)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.debtEnabled}
              onChange={(e) => handlePreferenceChange('debtEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Crédito</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.userActionsEnabled}
              onChange={(e) => handlePreferenceChange('userActionsEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Acciones de Usuarios</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.systemEnabled}
              onChange={(e) => handlePreferenceChange('systemEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Sistema</span>
          </label>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-gray-900 text-sm">Horario Silencioso</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.quietHoursEnabled}
              onChange={(e) => handleScheduleChange('quietHoursEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Habilitar horario silencioso</span>
          </label>
          
          {schedule.quietHoursEnabled && (
            <>
              <div className="grid grid-cols-2 gap-3 ml-6">
                <div>
                  <label className="text-xs text-gray-600">Desde</label>
                  <input
                    type="time"
                    value={schedule.quietHoursStart}
                    onChange={(e) => handleScheduleChange('quietHoursStart', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Hasta</label>
                  <input
                    type="time"
                    value={schedule.quietHoursEnd}
                    onChange={(e) => handleScheduleChange('quietHoursEnd', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer ml-6">
                <input
                  type="checkbox"
                  checked={schedule.bypassOnCritical}
                  onChange={(e) => handleScheduleChange('bypassOnCritical', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Permitir críticas durante horario silencioso</span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-2 px-4 py-3 border-t bg-gray-50 sticky bottom-0">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cerrar
        </button>
        <button
          onClick={() => {
            handleSavePreferences();
            handleSaveSchedule();
          }}
          disabled={isSaving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
