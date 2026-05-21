import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNotificationSchedule } from '@/infrastructure/api/notifications.api';
import { NotificationSchedule, ApiError } from '@/core/notification/entities/notification';

const QUERY_KEYS = {
  all: ['notifications'] as const,
  schedules: () => [...QUERY_KEYS.all, 'schedules'] as const,
};

interface UseScheduleMutationOptions {
  enableInvalidation?: boolean;
}

export function useScheduleMutation(
  options: UseScheduleMutationOptions = {}
) {
  const { enableInvalidation = true } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NotificationSchedule,
    ApiError,
    NotificationSchedule,
    { previousSchedule: NotificationSchedule | undefined }
  >({
    mutationFn: (data) => updateNotificationSchedule(data) as Promise<NotificationSchedule>,
    onMutate: async (newSchedule) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.schedules() });
      const previousSchedule = queryClient.getQueryData<NotificationSchedule>(
        QUERY_KEYS.schedules()
      );
      queryClient.setQueryData(QUERY_KEYS.schedules(), newSchedule);
      return { previousSchedule };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.schedules(), data);
      if (enableInvalidation) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSchedule) {
        queryClient.setQueryData(
          QUERY_KEYS.schedules(),
          context.previousSchedule
        );
      }
    },
    retry: 2,
  });

  return {
    updateSchedule: mutation.mutate,
    isPending: mutation.isPending,
    updateError: mutation.error,
  };
}
