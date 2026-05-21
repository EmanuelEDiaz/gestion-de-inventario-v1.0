import {
  useNotificationList,
} from './useNotificationsShared';
import type {
  UseNotificationListReturn,
  UseNotificationListOptions,
} from './useNotificationsShared';
import { getSystemNotifications } from '@/infrastructure/api/notifications.api';

export const SYSTEM_NOTIFICATIONS_PAGE_SIZE = 20;

export interface UseSystemNotificationsOptions
  extends UseNotificationListOptions {}

export type UseSystemNotificationsReturn = UseNotificationListReturn;

export function useSystemNotifications(
  options: UseSystemNotificationsOptions = {}
): UseSystemNotificationsReturn {
  return useNotificationList(
    {
      queryKeyPrefix: 'system',
      fetcher: getSystemNotifications,
      pageSize: SYSTEM_NOTIFICATIONS_PAGE_SIZE,
    },
    options
  );
}
