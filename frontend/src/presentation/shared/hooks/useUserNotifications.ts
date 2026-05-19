import {
  useNotificationList,
} from './useNotificationsShared';
import type {
  UseNotificationListReturn,
  UseNotificationListOptions,
} from './useNotificationsShared';
import { getUserNotifications } from '@/infrastructure/api/notifications.api';
import { INotification } from '@/core/entities/notification';

export const USER_NOTIFICATIONS_PAGE_SIZE = 20;

export interface UseUserNotificationsOptions
  extends UseNotificationListOptions {}

export type UseUserNotificationsReturn = UseNotificationListReturn;

export function useUserNotifications(
  options: UseUserNotificationsOptions = {}
): UseUserNotificationsReturn {
  return useNotificationList(
    {
      queryKeyPrefix: 'users',
      fetcher: getUserNotifications,
      pageSize: USER_NOTIFICATIONS_PAGE_SIZE,
      sseFilter: (n: INotification) => n.source === 'USER',
    },
    options
  );
}
