import { useCallback, useEffect, useRef } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { 
  listUserNotifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  markNotificationAsRead,
  deleteNotification,
} from '@/infrastructure/api/notifications.api';
import { 
  INotification,
  ApiError,
  PaginationParams,
} from '@/core/entities/notification';

const QUERY_KEYS = {
  all: ['notifications'] as const,
  users: () => [...QUERY_KEYS.all, 'users'] as const,
  usersList: (filters?: Record<string, unknown>) => 
    [...QUERY_KEYS.users(), 'list', filters] as const,
  usersInfinite: (filters?: Record<string, unknown>) => 
    [...QUERY_KEYS.users(), 'infinite', filters] as const,
};

export const USER_NOTIFICATIONS_PAGE_SIZE = 20;

interface UseUserNotificationsOptions {
  /**
   * Enable SSE real-time streaming for instant updates
   * @default true
   */
  enableSSE?: boolean;
  
  /**
   * Auto-refresh interval in ms (0 = disabled)
   * @default 30000 (30 seconds)
   */
  refetchInterval?: number;
  
  /**
   * Optional filters (priority, tags, read status)
   */
  filters?: Record<string, unknown>;
  
  /**
   * Cache stale time in ms
   * @default 5000 (5 seconds)
   */
  staleTime?: number;
  
  /**
   * Enable background sync (when tab loses focus)
   * @default true
   */
  enableBackgroundSync?: boolean;
}

/**
 * Hook para manejar notificaciones de otros usuarios con real-time updates vía SSE
 * 
 * Características:
 * - Datos en tiempo real vía Server-Sent Events
 * - Paginación infinita para scroll lazy-loading
 * - Cache management inteligente
 * - Background sync automático
 * - Optimistic UI updates
 * - Filtrado por fuente (USER) en backend
 * 
 * @example
 * ```tsx
 * function UserNotifications() {
 *   const { 
 *     data, 
 *     isLoading, 
 *     hasNextPage, 
 *     fetchNextPage 
 *   } = useUserNotifications({
 *     enableSSE: true,
 *     refetchInterval: 30000,
 *   });
 *   
 *   return (
 *     <div>
 *       {data?.pages.map(page =>
 *         page.content.map(notification => (
 *           <NotificationItem 
 *             key={notification.id} 
 *             notification={notification}
 *           />
 *         ))
 *       )}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()}>
 *           Load more
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUserNotifications(
  options: UseUserNotificationsOptions = {}
) {
  const {
    enableSSE = true,
    refetchInterval = 30000,
    filters = {},
    staleTime = 5000,
    enableBackgroundSync = true,
  } = options;

  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const unsubscribeTimerRef = useRef<NodeJS.Timeout>();
  const pageCountRef = useRef(0);

  // Main paginated query
  const query = useInfiniteQuery<
    { content: INotification[]; totalElements: number; hasMore: boolean },
    ApiError
  >({
    queryKey: QUERY_KEYS.usersInfinite(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const params: PaginationParams = {
        page: pageParam,
        size: USER_NOTIFICATIONS_PAGE_SIZE,
        ...filters,
      };
      const response = await listUserNotifications(params);
      pageCountRef.current = Math.max(pageCountRef.current, pageParam + 1);
      return {
        content: response.content,
        totalElements: response.totalElements,
        hasMore: response.hasMore ?? false,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length;
      }
      return undefined;
    },
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  /**
   * Setup SSE subscription para notificaciones de otros usuarios
   */
  useEffect(() => {
    if (!enableSSE || eventSourceRef.current) {
      return;
    }

    const setupSSE = () => {
      const unsubscribe = subscribeToNotifications(
        (notification: INotification) => {
          // Solo procesar notificaciones USER en este hook
          if (notification.source !== 'USER') {
            return;
          }

          // Invalidate cache para trigger re-fetch
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.users(),
          });

          // Optimistic update: agregar notificación al tope del first page
          queryClient.setQueryData(
            QUERY_KEYS.usersInfinite(filters),
            (oldData: any) => {
              if (!oldData?.pages?.length) return oldData;

              return {
                ...oldData,
                pages: [
                  {
                    ...oldData.pages[0],
                    content: [notification, ...oldData.pages[0].content],
                    totalElements: oldData.pages[0].totalElements + 1,
                  },
                  ...oldData.pages.slice(1),
                ],
              };
            }
          );
        },
        (error: Error) => {
          console.error('[User Notifications SSE] Stream error:', error);
          // Fallback to polling on SSE error
          if (refetchInterval > 0) {
            query.refetch();
          }
        }
      );

      eventSourceRef.current = unsubscribe as any;
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        unsubscribeFromNotifications();
        eventSourceRef.current = null;
      }
    };
  }, [enableSSE, queryClient, filters, query, refetchInterval]);

  /**
   * Setup background sync: re-sync cuando user regresa a tab
   */
  useEffect(() => {
    if (!enableBackgroundSync) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, invalidate to force refetch
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.users(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableBackgroundSync, queryClient]);

  /**
   * Handle mark as read mutation con optimistic update
   */
  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      queryClient.setQueryData(
        QUERY_KEYS.usersInfinite(filters),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              content: page.content.map((n: INotification) =>
                n.id === notificationId ? { ...n, read: true } : n
              ),
            })),
          };
        }
      );

      try {
        await markNotificationAsRead(notificationId);
      } catch (error) {
        // Revert optimistic update on error
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.users(),
        });
        throw error;
      }
    },
    [queryClient, filters]
  );

  /**
   * Handle delete mutation con optimistic update
   */
  const handleDelete = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      queryClient.setQueryData(
        QUERY_KEYS.usersInfinite(filters),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;

          return {
            ...oldData,
            pages: oldData.pages
              .map((page: any) => ({
                ...page,
                content: page.content.filter(
                  (n: INotification) => n.id !== notificationId
                ),
                totalElements: Math.max(0, page.totalElements - 1),
              }))
              .filter((page: any) => page.content.length > 0),
          };
        }
      );

      try {
        await deleteNotification(notificationId);
      } catch (error) {
        // Revert optimistic update on error
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.users(),
        });
        throw error;
      }
    },
    [queryClient, filters]
  );

  /**
   * Get unread count (memoized from data)
   */
  const unreadCount = query.data?.pages.reduce(
    (count, page) =>
      count + page.content.filter((n) => !n.read).length,
    0
  ) ?? 0;

  return {
    // Data
    notifications: query.data?.pages.flatMap((page) => page.content) ?? [],
    unreadCount,
    totalElements: query.data?.pages[0]?.totalElements ?? 0,

    // Status
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,

    // Pagination
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,

    // Mutations
    markAsRead: handleMarkAsRead,
    delete: handleDelete,

    // Manual controls
    refetch: query.refetch,
    invalidateCache: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.users(),
      }),
  };
}

export type UseUserNotificationsReturn = ReturnType<
  typeof useUserNotifications
>;
