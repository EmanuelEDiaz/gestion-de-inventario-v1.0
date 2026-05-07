import { useCallback, useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationSchedule,
  updateNotificationSchedule,
} from '@/infrastructure/api/notifications.api';
import {
  NotificationPreferences,
  NotificationPreferences as INotificationPreferences,
  NotificationSchedule,
  NotificationSchedule as INotificationSchedule,
  ApiError,
} from '@/core/entities/notification';

const QUERY_KEYS = {
  all: ['notifications'] as const,
  preferences: () => [...QUERY_KEYS.all, 'preferences'] as const,
  schedules: () => [...QUERY_KEYS.all, 'schedules'] as const,
};

interface UseNotificationPreferencesOptions {
  /**
   * Initial refetch interval in ms
   * @default 0 (disabled)
   */
  refetchInterval?: number;
  
  /**
   * Enable auto-invalidation of related queries on update
   * @default true
   */
  enableInvalidation?: boolean;
}

/**
 * Hook para manejar preferencias de notificaciones del usuario
 * 
 * Características:
 * - Carga preferencias del servidor (6 category toggles, 3 delivery channels)
 * - Muta preferencias con optimistic updates
 * - Maneja errores y retry automático
 * - Cache management inteligente
 * 
 * @example
 * ```tsx
 * function PreferencesPanel() {
 *   const { 
 *     preferences, 
 *     schedule,
 *     isPending,
 *     updatePreferences 
 *   } = useNotificationPreferences();
 *   
 *   const handleToggle = (categoryId: string) => {
 *     updatePreferences({
 *       ...preferences,
 *       [categoryId]: !preferences[categoryId]
 *     });
 *   };
 *   
 *   return (
 *     <div>
 *       {Object.entries(preferences).map(([key, value]) => (
 *         <label key={key}>
 *           <input
 *             type="checkbox"
 *             checked={value}
 *             onChange={() => handleToggle(key)}
 *           />
 *           {key}
 *         </label>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotificationPreferences(
  options: UseNotificationPreferencesOptions = {}
) {
  const {
    refetchInterval = 0,
    enableInvalidation = true,
  } = options;

  const queryClient = useQueryClient();

  // Fetch preferences
  const preferencesQuery = useQuery<NotificationPreferences, ApiError>({
    queryKey: QUERY_KEYS.preferences(),
    queryFn: () => getNotificationPreferences() as Promise<NotificationPreferences>,
    refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch schedule
  const scheduleQuery = useQuery<NotificationSchedule, ApiError>({
    queryKey: QUERY_KEYS.schedules(),
    queryFn: () => getNotificationSchedule() as Promise<NotificationSchedule>,
    refetchInterval,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation<NotificationPreferences, ApiError, NotificationPreferences, { previousPreferences: NotificationPreferences | undefined }>({
    mutationFn: (data) => updateNotificationPreferences(data) as Promise<NotificationPreferences>,
    onMutate: async (newPreferences): Promise<{ previousPreferences: NotificationPreferences | undefined }> => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.preferences() });

      // Snapshot old data
      const previousPreferences = queryClient.getQueryData(
        QUERY_KEYS.preferences()
      ) as NotificationPreferences | undefined;

      // Optimistic update
      queryClient.setQueryData(
        QUERY_KEYS.preferences(),
        newPreferences
      );

      return { previousPreferences };
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(QUERY_KEYS.preferences(), data);

      // Invalidate notifications cache to apply new preferences
      if (enableInvalidation) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.all,
        });
      }
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          QUERY_KEYS.preferences(),
          context.previousPreferences
        );
      }
    },
    retry: 2,
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation<NotificationSchedule, ApiError, NotificationSchedule, { previousSchedule: NotificationSchedule | undefined }>({
    mutationFn: (data) => updateNotificationSchedule(data) as Promise<NotificationSchedule>,
    onMutate: async (newSchedule): Promise<{ previousSchedule: NotificationSchedule | undefined }> => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.schedules() });

      // Snapshot old data
      const previousSchedule = queryClient.getQueryData(
        QUERY_KEYS.schedules()
      ) as NotificationSchedule | undefined;

      // Optimistic update
      queryClient.setQueryData(
        QUERY_KEYS.schedules(),
        newSchedule
      );

      return { previousSchedule };
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(QUERY_KEYS.schedules(), data);

      // Invalidate notifications cache to apply new quiet hours
      if (enableInvalidation) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.all,
        });
      }
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousSchedule) {
        queryClient.setQueryData(
          QUERY_KEYS.schedules(),
          context.previousSchedule
        );
      }
    },
    retry: 2,
  });

  // Mapping de nombres adaptados a nombres originales del backend
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

  // Helper function to toggle category
  const toggleCategory = useCallback(
    (categoryKey: string) => {
      const currentPreferences = preferencesQuery.data;
      if (!currentPreferences) return;

      const originalKey = categoryKeyMap[categoryKey] || categoryKey as keyof NotificationPreferences;
      updatePreferencesMutation.mutate({
        ...currentPreferences,
        [originalKey]: !currentPreferences[originalKey],
      });
    },
    [preferencesQuery.data, updatePreferencesMutation]
  );

  // Helper function to toggle delivery channel
  const toggleDeliveryChannel = useCallback(
    (channel: string) => {
      const currentPreferences = preferencesQuery.data;
      if (!currentPreferences) return;

      const originalKey = channelKeyMap[channel] || channel as keyof NotificationPreferences;
      updatePreferencesMutation.mutate({
        ...currentPreferences,
        [originalKey]: !currentPreferences[originalKey],
      });
    },
    [preferencesQuery.data, updatePreferencesMutation]
  );

  // Helper function to update quiet hours
  const updateQuietHours = useCallback(
    (startTime: string, endTime: string) => {
      const currentSchedule = scheduleQuery.data;
      if (!currentSchedule) return;

      updateScheduleMutation.mutate({
        ...currentSchedule,
        quietHoursStart: startTime,
        quietHoursEnd: endTime,
      });
    },
    [scheduleQuery.data, updateScheduleMutation]
  );

  // Helper function to toggle quiet hours
  const toggleQuietHours = useCallback(
    (enabled: boolean) => {
      const currentSchedule = scheduleQuery.data;
      if (!currentSchedule) return;

      updateScheduleMutation.mutate({
        ...currentSchedule,
        quietHoursEnabled: enabled,
      });
    },
    [scheduleQuery.data, updateScheduleMutation]
  );

  // Helper to check if a specific time is in quiet hours
  const isCurrentlyInQuietHours = useMemo(() => {
    if (!scheduleQuery.data?.quietHoursEnabled) {
      return false;
    }

    const schedule = scheduleQuery.data;
    if (!schedule?.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const startTime = schedule.quietHoursStart;
    const endTime = schedule.quietHoursEnd;

    if (!startTime || !endTime) return false;

    // Handle wrap-around midnight (e.g., 22:00 - 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }, [scheduleQuery.data]);

  // Mapper: adaptar nombres del backend a nombres que los componentes esperan
  const adaptedPreferences = useMemo(() => {
    const prefs = preferencesQuery.data;
    if (!prefs) return null;
    return {
      ...prefs,
      // Mapear nombres del servidor a nombres del componente
      toastEnabled: prefs.toastNotificationsEnabled,
      pushEnabled: prefs.pushNotificationsEnabled,
      inventoryEnabled: prefs.lowStockEnabled,
      creditEnabled: prefs.debtEnabled,
    };
  }, [preferencesQuery.data]);

  const adaptedSchedule = useMemo(() => {
    const sched = scheduleQuery.data;
    if (!sched) return null;
    return {
      ...sched,
      quietHoursStartTime: sched.quietHoursStart,
      quietHoursEndTime: sched.quietHoursEnd,
    };
  }, [scheduleQuery.data]);

  return {
    // Data (adaptada para componentes UI)
    preferences: adaptedPreferences,
    schedule: adaptedSchedule,
    // Data raw (para lógica de negocio si se necesita)
    rawPreferences: preferencesQuery.data,
    rawSchedule: scheduleQuery.data,

    // Query status
    isLoading: preferencesQuery.isLoading || scheduleQuery.isLoading,
    isError: preferencesQuery.isError || scheduleQuery.isError,
    error: preferencesQuery.error || scheduleQuery.error,

    // Mutation status
    isPending: updatePreferencesMutation.isPending || updateScheduleMutation.isPending,
    updateError: updatePreferencesMutation.error || updateScheduleMutation.error,
    updateErrorMessage: (updatePreferencesMutation.error || updateScheduleMutation.error)
      ? (updatePreferencesMutation.error as ApiError)?.detail || (updateScheduleMutation.error as ApiError)?.detail || 'Error desconocido'
      : null,

    // Helpers
    toggleCategory,
    toggleDeliveryChannel,
    updateQuietHours,
    toggleQuietHours,
    isCurrentlyInQuietHours,

    // Manual update functions
    updatePreferences: updatePreferencesMutation.mutate,
    updateSchedule: updateScheduleMutation.mutate,

    // Manual controls
    refetch: async () => {
      await preferencesQuery.refetch();
      await scheduleQuery.refetch();
    },
    invalidateCache: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.preferences() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules() });
    },
  };
}

export type UseNotificationPreferencesReturn = ReturnType<
  typeof useNotificationPreferences
>;
