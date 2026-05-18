'use client';

import React from 'react';
import type { Notification } from '@/core/entities/notification';
import { NotificationIcon } from './NotificationIcon';
import { NotificationContent } from './NotificationContent';
import { NotificationActions } from './NotificationActions';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isSelected = false,
}: NotificationItemProps) {
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      className={`p-4 border-l-4 transition-all ${
        isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
      } ${notification.read ? 'opacity-60' : 'opacity-100'} ${
        notification.priority === 'CRITICAL' ? 'border-red-500' :
        notification.priority === 'HIGH' ? 'border-orange-500' :
        notification.priority === 'MEDIUM' ? 'border-yellow-500' :
        'border-blue-500'
      }`}
    >
      <NotificationIcon
        category={notification.category}
        priority={notification.priority}
        createdAt={notification.createdAt}
      />
      <NotificationContent
        title={notification.title}
        body={notification.body}
        tags={notification.tags}
      />
      <div className="flex items-center justify-between">
        <div />
        <NotificationActions
          read={notification.read}
          onMarkAsRead={handleMarkAsRead}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
