'use client';

import React from 'react';
import { Notification } from '@/core/entities/notification';
import { NotificationItem } from './NotificationItem';
import { Users } from 'lucide-react';

interface UsersTabProps {
  notifications: Notification[];
  isLoading: boolean;
  error?: string;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function UsersTab({
  notifications,
  isLoading,
  error,
  onMarkAsRead,
  onDelete,
}: UsersTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando notificaciones de usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md m-2">
        Error: {error}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="h-12 w-12 text-gray-300 mb-2" />
        <p className="text-gray-500">No hay notificaciones de otros usuarios</p>
      </div>
    );
  }

  return (
    <div className="space-y-px">
      {notifications.map((notif) => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
