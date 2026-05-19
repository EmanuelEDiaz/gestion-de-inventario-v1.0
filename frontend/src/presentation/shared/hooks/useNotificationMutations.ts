import { useCallback } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import {
  markNotificationAsRead,
  deleteNotification,
} from '@/infrastructure/api/notifications.api';

interface PageData {
  content: { id: string; read: boolean }[];
  totalElements: number;
}

export function useNotificationMutations(
  infiniteKey: readonly unknown[],
  typeKey: readonly string[]
) {
  const queryClient = useQueryClient();

  const markAsRead = useCallback(
    async (notificationId: string) => {
      queryClient.setQueryData<InfiniteData<PageData>>(infiniteKey, (oldData) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            content: page.content.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
          })),
        };
      });
      try { await markNotificationAsRead(notificationId); }
      catch (error) { queryClient.invalidateQueries({ queryKey: typeKey }); throw error; }
    },
    [queryClient, infiniteKey, typeKey]
  );

  const deleteNotif = useCallback(
    async (notificationId: string) => {
      queryClient.setQueryData<InfiniteData<PageData>>(infiniteKey, (oldData) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages
            .map((page) => ({
              ...page,
              content: page.content.filter((n) => n.id !== notificationId),
              totalElements: Math.max(0, page.totalElements - 1),
            }))
            .filter((page) => page.content.length > 0),
        };
      });
      try { await deleteNotification(notificationId); }
      catch (error) { queryClient.invalidateQueries({ queryKey: typeKey }); throw error; }
    },
    [queryClient, infiniteKey, typeKey]
  );

  return { markAsRead, delete: deleteNotif };
}
