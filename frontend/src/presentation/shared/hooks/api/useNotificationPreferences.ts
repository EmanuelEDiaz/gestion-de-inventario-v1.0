import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePreferencesQuery } from './usePreferencesQuery';
import { useScheduleQuery } from './useScheduleQuery';
import { usePreferencesMutation } from './usePreferencesMutation';
import { useScheduleMutation } from './useScheduleMutation';
import { NotificationPreferences, ApiError } from '@/core/notification/entities/notification';

interface UseNotificationPreferencesOptions {
  refetchInterval?: number;
  enableInvalidation?: boolean;
}

export function useNotificationPreferences(
  options: UseNotificationPreferencesOptions = {}
) {
  const { refetchInterval = 0, enableInvalidation = true } = options;
  const queryClient = useQueryClient();

  const pref = usePreferencesQuery({ refetchInterval });
  const sched = useScheduleQuery({ refetchInterval });
  const prefMut = usePreferencesMutation({ enableInvalidation });
  const schedMut = useScheduleMutation({ enableInvalidation });

  const categoryKeyMap: Record<string, keyof NotificationPreferences> = {
    inventoryEnabled: 'lowStockEnabled',
    syncEnabled: 'syncEnabled',
    operationsEnabled: 'operationsEnabled',
    creditEnabled: 'debtEnabled',
    userActionsEnabled: 'userActionsEnabled',
    systemEnabled: 'systemEnabled',
  };

  const channelKeyMap: Record<string, keyof NotificationPreferences> = {
    sseEnabled: 'sseEnabled',
    toastEnabled: 'toastNotificationsEnabled',
    pushEnabled: 'pushNotificationsEnabled',
  };

  const toggleCategory = useCallback(
    (categoryKey: string) => {
      if (!pref.rawPreferences) return;
      const originalKey = categoryKeyMap[categoryKey] || categoryKey as keyof NotificationPreferences;
      prefMut.updatePreferences({ ...pref.rawPreferences, [originalKey]: !pref.rawPreferences[originalKey] });
    },
    [pref.rawPreferences, prefMut.updatePreferences]
  );

  const toggleDeliveryChannel = useCallback(
    (channel: string) => {
      if (!pref.rawPreferences) return;
      const originalKey = channelKeyMap[channel] || channel as keyof NotificationPreferences;
      prefMut.updatePreferences({ ...pref.rawPreferences, [originalKey]: !pref.rawPreferences[originalKey] });
    },
    [pref.rawPreferences, prefMut.updatePreferences]
  );

  const updateQuietHoursFn = useCallback(
    (startTime: string, endTime: string) => {
      if (!sched.rawSchedule) return;
      schedMut.updateSchedule({ ...sched.rawSchedule, quietHoursStart: startTime, quietHoursEnd: endTime });
    },
    [sched.rawSchedule, schedMut.updateSchedule]
  );

  const toggleQuietHoursFn = useCallback(
    (enabled: boolean) => {
      if (!sched.rawSchedule) return;
      schedMut.updateSchedule({ ...sched.rawSchedule, quietHoursEnabled: enabled });
    },
    [sched.rawSchedule, schedMut.updateSchedule]
  );

  const isCurrentlyInQuietHours = useMemo(() => {
    if (!sched.rawSchedule?.quietHoursEnabled) return false;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const { quietHoursStart: startTime, quietHoursEnd: endTime } = sched.rawSchedule;
    if (!startTime || !endTime) return false;
    return startTime > endTime
      ? currentTime >= startTime || currentTime < endTime
      : currentTime >= startTime && currentTime < endTime;
  }, [sched.rawSchedule]);

  const adaptedPreferences = useMemo(() => {
    if (!pref.rawPreferences) return null;
    return {
      ...pref.rawPreferences,
      toastEnabled: pref.rawPreferences.toastNotificationsEnabled,
      pushEnabled: pref.rawPreferences.pushNotificationsEnabled,
      inventoryEnabled: pref.rawPreferences.lowStockEnabled,
      creditEnabled: pref.rawPreferences.debtEnabled,
    };
  }, [pref.rawPreferences]);

  const adaptedSchedule = useMemo(() => {
    if (!sched.rawSchedule) return null;
    return {
      ...sched.rawSchedule,
      quietHoursStartTime: sched.rawSchedule.quietHoursStart,
      quietHoursEndTime: sched.rawSchedule.quietHoursEnd,
    };
  }, [sched.rawSchedule]);

  return {
    preferences: adaptedPreferences,
    schedule: adaptedSchedule,
    rawPreferences: pref.rawPreferences,
    rawSchedule: sched.rawSchedule,
    isLoading: pref.isLoading || sched.isLoading,
    isError: pref.isError || sched.isError,
    error: pref.error || sched.error,
    isPending: prefMut.isPending || schedMut.isPending,
    updateError: prefMut.updateError || schedMut.updateError,
    updateErrorMessage: (prefMut.updateError || schedMut.updateError)
      ? (prefMut.updateError as ApiError)?.detail || (schedMut.updateError as ApiError)?.detail || 'Error desconocido'
      : null,
    toggleCategory,
    toggleDeliveryChannel,
    updateQuietHours: updateQuietHoursFn,
    toggleQuietHours: toggleQuietHoursFn,
    isCurrentlyInQuietHours,
    updatePreferences: prefMut.updatePreferences,
    updateSchedule: schedMut.updateSchedule,
    refetch: async () => {
      await pref.refetch();
      await sched.refetch();
    },
    invalidateCache: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  };
}

export type UseNotificationPreferencesReturn = ReturnType<
  typeof useNotificationPreferences
>;
