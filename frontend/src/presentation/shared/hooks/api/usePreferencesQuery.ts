import { useQuery } from '@tanstack/react-query';
import { getNotificationPreferences } from '@/infrastructure/api/notifications.api';
import { NotificationPreferences, ApiError } from '@/core/notification/entities/notification';

const QUERY_KEYS = {
  all: ['notifications'] as const,
  preferences: () => [...QUERY_KEYS.all, 'preferences'] as const,
};

interface UsePreferencesQueryOptions {
  refetchInterval?: number;
}

export function usePreferencesQuery(
  options: UsePreferencesQueryOptions = {}
) {
  const { refetchInterval = 0 } = options;

  const query = useQuery<NotificationPreferences, ApiError>({
    queryKey: QUERY_KEYS.preferences(),
    queryFn: () => getNotificationPreferences() as Promise<NotificationPreferences>,
    refetchInterval,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    preferences: query.data,
    rawPreferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
