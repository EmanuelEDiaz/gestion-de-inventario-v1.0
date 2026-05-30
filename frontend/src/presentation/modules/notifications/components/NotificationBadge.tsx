'use client';

import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { useUnreadCount } from '../hooks/useNotifications';
import Link from 'next/link';
import { Bell } from '@/presentation/shared/components/ui/icon-mapping';

export function NotificationBadge() {
  const { data: count = 0 } = useUnreadCount();

  return (
    <TooltipWrapper content={count > 0 ? `${count} notificaciones sin leer` : 'Sin notificaciones nuevas'} side="bottom">
      <Link
        href="/notifications"
        className="relative inline-flex items-center p-2 rounded-full hover:bg-gray-100 transition-colors"
        title={count > 0 ? `${count} notificaciones sin leer` : 'Sin notificaciones nuevas'}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </TooltipWrapper>
  );
}
