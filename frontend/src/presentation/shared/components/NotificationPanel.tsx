/**
 * NotificationPanel.tsx
 * 
 * Contenedor principal del panel de notificaciones
 * - Muestra campanita en navbar
 * - Al hacer click, abre panel con 2 tabs
 * - Integración con hooks (Week 4)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Bell, Settings, Trash2 } from 'lucide-react';
import { Notification } from '@/core/entities/notification';
import { NotificationTabs, type TabType } from './NotificationTabs';
import { PreferencesPanel } from './PreferencesPanel';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '@/infrastructure/api/notifications.api';

interface NotificationPanelProps {
  systemNotifications: Notification[];
  userNotifications: Notification[];
  isLoadingSystem?: boolean;
  isLoadingUsers?: boolean;
  errorSystem?: string;
  errorUsers?: string;
  unreadCount?: number;
  token?: string;
}

export function NotificationPanel({
  systemNotifications,
  userNotifications,
  isLoadingSystem = false,
  isLoadingUsers = false,
  errorSystem,
  errorUsers,
  unreadCount = 0,
  token,
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('sistema');
  const [showPreferences, setShowPreferences] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        setIsMarkingAsRead(true);
        await markNotificationAsRead(notificationId, token);
        // En Week 4, aquí invalidaremos el cache de TanStack Query
      } catch (error) {
        console.error('Error marking notification as read:', error);
      } finally {
        setIsMarkingAsRead(false);
      }
    },
    [token]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      setIsMarkingAsRead(true);
      await markAllNotificationsAsRead(token);
      // En Week 4, aquí invalidaremos el cache de TanStack Query
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsMarkingAsRead(false);
    }
  }, [token]);

  const handleDelete = useCallback(
    async (notificationId: string) => {
      try {
        await deleteNotification(notificationId, token);
        // En Week 4, aquí invalidaremos el cache de TanStack Query
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    },
    [token]
  );

  if (showPreferences) {
    return (
      <PreferencesPanel 
        onClose={() => setShowPreferences(false)}
        token={token}
      />
    );
  }

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
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
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
                  {(systemNotifications.length > 0 || userNotifications.length > 0) && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={isMarkingAsRead}
                      title="Marcar todas como leídas"
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-sm text-gray-600"
                    >
                      <Trash2 className="h-5 w-5" />
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
              <NotificationTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                systemNotifications={systemNotifications}
                userNotifications={userNotifications}
                isLoadingSystem={isLoadingSystem}
                isLoadingUsers={isLoadingUsers}
                errorSystem={errorSystem}
                errorUsers={errorUsers}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
