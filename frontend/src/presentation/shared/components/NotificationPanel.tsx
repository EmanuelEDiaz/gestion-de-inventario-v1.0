/**
 * NotificationPanel.tsx
 * 
 * Contenedor principal del panel de notificaciones (Week 4 - Real-time SSE)
 * - Muestra campanita en navbar con badge de no-leídas
 * - Al hacer click, abre panel con 2 tabs (Sistema / De Usuarios)
 * - Integración con TanStack Query para real-time updates
 * - SSE streaming automático de notificaciones
 * - Optimistic UI updates
 * - Background sync cuando regresa el focus del tab
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Bell, Settings, CheckCheck } from 'lucide-react';
import { NotificationTabs, type TabType } from './NotificationTabs';
import { PreferencesPanel } from './PreferencesPanel';
import { NotificationBadge } from './NotificationBadge';
import { 
  useSystemNotifications, 
  useUserNotifications,
  useNotificationToasts,
} from '@/presentation/shared/hooks';

interface NotificationPanelProps {
  /**
   * Optional: Override for SSE enable (default: true)
   */
  enableSSE?: boolean;
}

export function NotificationPanel({
  enableSSE = true,
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('sistema');
  const [showPreferences, setShowPreferences] = useState(false);

  // System notifications with real-time SSE
  const systemNotifications = useSystemNotifications({
    enableSSE,
    refetchInterval: 30000, // 30 seconds fallback polling
    enableBackgroundSync: true,
  });

  // User notifications with real-time SSE
  const userNotifications = useUserNotifications({
    enableSSE,
    refetchInterval: 30000,
    enableBackgroundSync: true,
  });

  // Combined unread count
  const totalUnreadCount = 
    (systemNotifications.unreadCount ?? 0) + 
    (userNotifications.unreadCount ?? 0);

  // Combined loading state
  const isLoading = systemNotifications.isLoading || userNotifications.isLoading;

  // Combined error state
  const errorSystem = systemNotifications.error?.message;
  const errorUsers = userNotifications.error?.message;

  // Activate toasts for CRITICAL notifications
  useNotificationToasts(systemNotifications, userNotifications);
  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    // Mark all in system tab
    const systemIds = systemNotifications.notifications
      .filter(n => !n.read)
      .map(n => n.id);
    
    // Mark all in user tab
    const userIds = userNotifications.notifications
      .filter(n => !n.read)
      .map(n => n.id);

    // Batch operations
    const allIds = [...systemIds, ...userIds];
    const promises = allIds.map(id => {
      if (systemIds.includes(id)) {
        return systemNotifications.markAsRead(id);
      }
      return userNotifications.markAsRead(id);
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [systemNotifications, userNotifications]);

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      if (activeTab === 'sistema') {
        return systemNotifications.markAsRead(notificationId);
      }
      return userNotifications.markAsRead(notificationId);
    },
    [activeTab, systemNotifications, userNotifications]
  );

  const handleDelete = useCallback(
    (notificationId: string) => {
      if (activeTab === 'sistema') {
        return systemNotifications.delete(notificationId);
      }
      return userNotifications.delete(notificationId);
    },
    [activeTab, systemNotifications, userNotifications]
  );

  return (
    <>
      {/* Botón Campanita en Navbar */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Notificaciones"
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="h-6 w-6" />
          <NotificationBadge count={totalUnreadCount} />
        </button>

        {/* Panel Dropdown */}
        {isOpen && (
          <div className="fixed inset-0 z-40 md:fixed md:right-0 md:top-16 md:w-96 md:rounded-lg md:shadow-lg md:inset-auto md:border md:bg-white">
            {/* Mobile: Full screen overlay */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel Content */}
            <div className="relative bg-white h-screen md:h-96 flex flex-col md:rounded-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">Notificaciones</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreferences(true)}
                    title="Preferencias"
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Settings className="h-5 w-5 text-gray-600" />
                  </button>
                  {totalUnreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      title="Marcar todas como leídas"
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <CheckCheck className="h-5 w-5 text-gray-600" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Tabs */}
              {showPreferences ? (
                <PreferencesPanel 
                  onClose={() => setShowPreferences(false)}
                />
              ) : (
                <NotificationTabs
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
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
