import { useQuery } from '@tanstack/react-query';
import { getNotificationSchedule } from '@/infrastructure/api/notifications.api';
import { NotificationSchedule, ApiError } from '@/core/entities/notification';

const QUERY_KEYS = {
  all: ['notifications'] as const,
  schedules: () => [...QUERY_KEYS.all, 'schedules'] as const,
};

interface UseScheduleQueryOptions {
  refetchInterval?: number;
}

export function useScheduleQuery(
  options: UseScheduleQueryOptions = {}
) {
  const { refetchInterval = 0 } = options;

  const query = useQuery<NotificationSchedule, ApiError>({
    queryKey: QUERY_KEYS.schedules(),
    queryFn: () => getNotificationSchedule() as Promise<NotificationSchedule>,
    refetchInterval,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    schedule: query.data,
    rawSchedule: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
