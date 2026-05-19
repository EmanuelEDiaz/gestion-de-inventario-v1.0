import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { UseSystemNotificationsReturn } from './useSystemNotifications';
import { UseUserNotificationsReturn } from './useUserNotifications';
import { ToastContent } from '@/presentation/shared/components/ui/toast';
import { INotification, NotificationPriority } from '@/core/entities/notification';
import { getToastVariant, getCategoryDescription } from './notification-toast-helpers';

function showToast(notification: INotification): void {
  const variant = getToastVariant(notification);
  toast.custom(
    (t) =>
      React.createElement(ToastContent, {
        title: notification.title,
        description: getCategoryDescription(notification.category),
        variant,
        duration: 5000,
      }),
    {
      duration: 5000,
      position: 'top-right',
      classNames: { toast: 'p-0 shadow-lg rounded-lg' },
    }
  );
}

export function useToastManager(
  systemNotifications?: UseSystemNotificationsReturn,
  userNotifications?: UseUserNotificationsReturn
): void {
  const shownIds = useRef(new Set<string>());

  useEffect(() => {
    const notifications: INotification[] = [
      ...(systemNotifications?.notifications ?? []),
      ...(userNotifications?.notifications ?? []),
    ];

    for (const notif of notifications) {
      if (notif.priority !== NotificationPriority.CRITICAL || notif.read) continue;
      if (shownIds.current.has(notif.id)) continue;

      shownIds.current.add(notif.id);
      showToast(notif);
    }
  }, [systemNotifications?.notifications, userNotifications?.notifications]);
}
