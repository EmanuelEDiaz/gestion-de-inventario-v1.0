// Notification-specific hooks
export {
  useSystemNotifications,
  SYSTEM_NOTIFICATIONS_PAGE_SIZE,
  type UseSystemNotificationsReturn,
} from './useSystemNotifications';

export {
  useUserNotifications,
  USER_NOTIFICATIONS_PAGE_SIZE,
  type UseUserNotificationsReturn,
} from './useUserNotifications';

export {
  useNotificationPreferences,
  type UseNotificationPreferencesReturn,
} from './useNotificationPreferences';

export {
  useNotificationToasts,
} from './useNotificationToasts';

// Re-export existing hooks for convenience
export { useAuthStore } from './useAuthStore';
export { useCacheProgress } from './useCacheProgress';
export { useDebounce } from './useDebounce';
export { useNetworkHealth } from './useNetworkHealth';
export { useSidebarSections } from './useSidebarSections';
export { useSort } from './useSort';
export { useSyncStatus } from './useSyncStatus';
