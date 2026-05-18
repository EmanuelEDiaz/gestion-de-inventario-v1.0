'use client';

import React, { useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { NotificationBadge } from './NotificationBadge';
import { NotificationFilter } from './NotificationFilter';
import { NotificationList } from './NotificationList';
import {
  useSystemNotifications,
  useUserNotifications,
  useNotificationToasts,
} from '@/presentation/shared/hooks';

interface NotificationPanelProps {
  enableSSE?: boolean;
}

export function NotificationPanel({ enableSSE = true }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sistema' | 'usuarios'>('sistema');
  const [showPreferences, setShowPreferences] = useState(false);

  const systemNotifications = useSystemNotifications({ enableSSE, refetchInterval: 30000, enableBackgroundSync: true });
  const userNotifications = useUserNotifications({ enableSSE, refetchInterval: 30000, enableBackgroundSync: true });

  const totalUnreadCount = (systemNotifications.unreadCount ?? 0) + (userNotifications.unreadCount ?? 0);
  const errorSystem = systemNotifications.error?.message;
  const errorUsers = userNotifications.error?.message;

  useNotificationToasts(systemNotifications, userNotifications);

  const handleMarkAllAsRead = useCallback(async () => {
    const systemIds = systemNotifications.notifications?.filter((n) => !n.read).map((n) => n.id) ?? [];
    const userIds = userNotifications.notifications?.filter((n) => !n.read).map((n) => n.id) ?? [];
    const allIds = [...systemIds, ...userIds];
    const promises = allIds.map((id) => systemIds.includes(id) ? systemNotifications.markAsRead(id) : userNotifications.markAsRead(id));
    try { await Promise.all(promises); } catch (error) { console.error('Error marking all as read:', error); }
  }, [systemNotifications, userNotifications]);

  const handleMarkAsRead = useCallback((notificationId: string) => (
    activeTab === 'sistema' ? systemNotifications.markAsRead(notificationId) : userNotifications.markAsRead(notificationId)
  ), [activeTab, systemNotifications, userNotifications]);

  const handleDelete = useCallback((notificationId: string) => (
    activeTab === 'sistema' ? systemNotifications.delete(notificationId) : userNotifications.delete(notificationId)
  ), [activeTab, systemNotifications, userNotifications]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notificaciones"
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        <NotificationBadge count={totalUnreadCount} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 md:fixed md:right-0 md:top-16 md:w-96 md:rounded-lg md:shadow-lg md:inset-auto md:border md:bg-white">
          <div className="absolute inset-0 bg-black bg-opacity-50 md:hidden" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white h-screen md:h-96 flex flex-col md:rounded-lg overflow-hidden">
            <NotificationFilter
              totalUnreadCount={totalUnreadCount}
              onMarkAllAsRead={handleMarkAllAsRead}
              onShowPreferences={() => setShowPreferences(true)}
              onClose={() => setIsOpen(false)}
            />
            <NotificationList
              showPreferences={showPreferences}
              onClosePreferences={() => setShowPreferences(false)}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              systemNotifications={systemNotifications.notifications}
              userNotifications={userNotifications.notifications}
              isLoadingSystem={systemNotifications.isLoading}
              isLoadingUsers={userNotifications.isLoading}
              errorSystem={errorSystem}
              errorUsers={errorUsers}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}
    </div>
  );
}
