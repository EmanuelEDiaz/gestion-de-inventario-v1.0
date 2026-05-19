import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNotificationPreferences } from '@/infrastructure/api/notifications.api';
import { NotificationPreferences, ApiError } from '@/core/entities/notification';

const QUERY_KEYS = {
  all: ['notifications'] as const,
  preferences: () => [...QUERY_KEYS.all, 'preferences'] as const,
};

interface UsePreferencesMutationOptions {
  enableInvalidation?: boolean;
}

export function usePreferencesMutation(
  options: UsePreferencesMutationOptions = {}
) {
  const { enableInvalidation = true } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NotificationPreferences,
    ApiError,
    NotificationPreferences,
    { previousPreferences: NotificationPreferences | undefined }
  >({
    mutationFn: (data) => updateNotificationPreferences(data) as Promise<NotificationPreferences>,
    onMutate: async (newPreferences) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.preferences() });
      const previousPreferences = queryClient.getQueryData<NotificationPreferences>(
        QUERY_KEYS.preferences()
      );
      queryClient.setQueryData(QUERY_KEYS.preferences(), newPreferences);
      return { previousPreferences };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.preferences(), data);
      if (enableInvalidation) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          QUERY_KEYS.preferences(),
          context.previousPreferences
        );
      }
    },
    retry: 2,
  });

  return {
    updatePreferences: mutation.mutate,
    isPending: mutation.isPending,
    updateError: mutation.error,
  };
}
