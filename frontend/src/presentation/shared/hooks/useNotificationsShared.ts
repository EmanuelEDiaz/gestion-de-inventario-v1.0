import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  INotification,
  NotificationListResponse,
} from '@/core/entities/notification';
import { useNotificationStream } from './useNotificationStream';
import { useNotificationMutations } from './useNotificationMutations';

export interface UseNotificationListConfig {
  queryKeyPrefix: string;
  fetcher: (page: number, size: number) => Promise<NotificationListResponse>;
  pageSize: number;
  sseFilter?: (notification: INotification) => boolean;
}

export interface UseNotificationListOptions {
  enableSSE?: boolean;
  refetchInterval?: number;
  filters?: Record<string, unknown>;
  staleTime?: number;
  enableBackgroundSync?: boolean;
}

interface PageData {
  content: INotification[];
  totalElements: number;
  hasMore: boolean;
}

export interface UseNotificationListReturn {
  notifications: INotification[];
  unreadCount: number;
  totalElements: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isRefetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  delete: (notificationId: string) => Promise<void>;
  refetch: () => void;
  invalidateCache: () => void;
}

export function useNotificationList(
  config: UseNotificationListConfig,
  options: UseNotificationListOptions = {}
): UseNotificationListReturn {
  const {
    enableSSE = true, refetchInterval = 30000, filters = {},
    staleTime = 5000, enableBackgroundSync = true,
  } = options;

  const { queryKeyPrefix, fetcher, pageSize, sseFilter } = config;
  const typeKey = ['notifications', queryKeyPrefix] as const;
  const infiniteKey = [...typeKey, 'infinite', filters];

  const query = useInfiniteQuery({
    queryKey: infiniteKey,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetcher(pageParam, pageSize);
      return { content: response.items, totalElements: response.pagination.totalItems, hasMore: response.pagination.hasNext } satisfies PageData;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: PageData, allPages: PageData[]) =>
      lastPage.hasMore ? allPages.length : undefined,
    staleTime,
    gcTime: 10 * 60 * 1000,
  });

  useNotificationStream({ typeKey, infiniteKey, enableSSE, enableBackgroundSync, refetchInterval, sseFilter, refetch: query.refetch });

  const { markAsRead, delete: deleteNotif } = useNotificationMutations(infiniteKey, typeKey);

  const unreadCount = query.data?.pages.reduce(
    (count, page) => count + page.content.filter((n) => !n.read).length, 0
  ) ?? 0;

  return {
    notifications: query.data?.pages.flatMap((page) => page.content) ?? [],
    unreadCount, totalElements: query.data?.pages[0]?.totalElements ?? 0,
    isLoading: query.isLoading, isError: query.isError, error: query.error,
    isRefetching: query.isRefetching, hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage, fetchNextPage: query.fetchNextPage,
    markAsRead, delete: deleteNotif, refetch: query.refetch,
    invalidateCache: () => queryClient.invalidateQueries({ queryKey: typeKey }),
  };
}
