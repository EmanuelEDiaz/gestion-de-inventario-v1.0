'use client';

import type { Notification } from '@/core/entities/notification';
import { NOTIFICATION_CATEGORY_LABELS } from '@/core/entities/notification';
import { cn } from '@/presentation/shared/lib/utils';
import { useMarkRead } from '../hooks/useMarkRead';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  notification: Notification;
}

const CATEGORY_COLORS: Record<string, string> = {
  LOW_STOCK: 'bg-yellow-100 text-yellow-800',
  SYSTEM: 'bg-gray-100 text-gray-800',
  SALE: 'bg-green-100 text-green-800',
  PURCHASE: 'bg-blue-100 text-blue-800',
  SYNC: 'bg-purple-100 text-purple-800',
};

export function NotificationItem({ notification }: Props) {
  const { markOne } = useMarkRead();

  const handleMarkRead = () => {
    if (!notification.read) {
      markOne.mutate(notification.id);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        notification.read
          ? 'bg-white border-gray-100'
          : 'bg-blue-50 border-blue-100'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              'inline-block px-1.5 py-0.5 rounded text-[11px] font-medium',
              CATEGORY_COLORS[notification.category] ?? 'bg-gray-100 text-gray-800'
            )}
          >
            {NOTIFICATION_CATEGORY_LABELS[notification.category]}
          </span>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" title="Sin leer" />
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
        {notification.body && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>
      {!notification.read && (
        <button
          onClick={handleMarkRead}
          disabled={markOne.isPending}
          className="shrink-0 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
          title="Marcar como leída"
        >
          Leída
        </button>
      )}
    </div>
  );
}
