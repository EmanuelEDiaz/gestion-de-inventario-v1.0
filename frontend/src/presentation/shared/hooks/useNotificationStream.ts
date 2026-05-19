import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '@/infrastructure/api/notifications.api';
import { INotification } from '@/core/entities/notification';

interface UseNotificationStreamOptions {
  typeKey: readonly string[];
  infiniteKey: readonly unknown[];
  enableSSE?: boolean;
  enableBackgroundSync?: boolean;
  refetchInterval?: number;
  sseFilter?: (notification: INotification) => boolean;
  refetch: () => void;
}

export function useNotificationStream(options: UseNotificationStreamOptions): void {
  const {
    typeKey, infiniteKey, enableSSE = true,
    enableBackgroundSync = true, refetchInterval = 30000,
    sseFilter, refetch,
  } = options;

  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const sseFilterRef = useRef(sseFilter);
  sseFilterRef.current = sseFilter;

  useEffect(() => {
    if (!enableSSE || eventSourceRef.current) return;

    const unsubscribe = subscribeToNotifications(
      undefined,
      (notification: INotification) => {
        if (sseFilterRef.current && !sseFilterRef.current(notification)) return;

        queryClient.invalidateQueries({ queryKey: typeKey });

        queryClient.setQueryData(infiniteKey, (oldData: any) => {
          if (!oldData?.pages?.length) return oldData;
          return {
            ...oldData,
            pages: [
              { ...oldData.pages[0], content: [notification, ...oldData.pages[0].content], totalElements: oldData.pages[0].totalElements + 1 },
              ...oldData.pages.slice(1),
            ],
          };
        });
      },
      (error: Error) => {
        console.error(`[SSE] Stream error:`, error);
        if (refetchInterval > 0) refetch();
      }
    );

    eventSourceRef.current = unsubscribe;
    return () => {
      if (eventSourceRef.current) {
        unsubscribeFromNotifications(eventSourceRef.current);
        eventSourceRef.current = null;
      }
    };
  }, [enableSSE, queryClient, typeKey, infiniteKey, refetchInterval, refetch]);

  useEffect(() => {
    if (!enableBackgroundSync) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) queryClient.invalidateQueries({ queryKey: typeKey });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enableBackgroundSync, queryClient, typeKey]);
}
