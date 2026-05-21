'use client';

import { Bell } from 'lucide-react';
import { getCategoryLabel, getPriorityColor } from '@/core/notification/entities/notification';
import type { Notification } from '@/core/notification/entities/notification';

interface NotificationIconProps {
  category: Notification['category'];
  priority: Notification['priority'];
  createdAt: string;
}

export function NotificationIcon({ category, priority, createdAt }: NotificationIconProps) {
  const formattedDate = new Date(createdAt).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-semibold text-gray-700">
          {getCategoryLabel(category)}
        </span>
        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(priority)}`}>
          {priority}
        </span>
      </div>
      <span className="text-xs text-gray-500">{formattedDate}</span>
    </div>
  );
}
