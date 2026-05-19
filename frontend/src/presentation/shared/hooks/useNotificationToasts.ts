import { UseSystemNotificationsReturn } from './useSystemNotifications';
import { UseUserNotificationsReturn } from './useUserNotifications';
import { useToastManager } from './useToastManager';

export function useNotificationToasts(
  systemNotifications?: UseSystemNotificationsReturn,
  userNotifications?: UseUserNotificationsReturn
): void {
  useToastManager(systemNotifications, userNotifications);
}
