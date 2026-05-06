/**
 * NotificationTabs.tsx
 * 
 * Componente de tabs para separar:
 * - Tab 1: SISTEMA (source=SYSTEM)
 * - Tab 2: DE USUARIOS (source=USER)
 */

'use client';

import React from 'react';
import { Notification } from '@/core/entities/notification';
import { NotificationItem } from './NotificationItem';
import { AlertCircle, Users } from 'lucide-react';

export type TabType = 'sistema' | 'usuarios';

interface NotificationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  systemNotifications: Notification[];
  userNotifications: Notification[];
  isLoadingSystem: boolean;
  isLoadingUsers: boolean;
  errorSystem?: string;
  errorUsers?: string;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationTabs({
  activeTab,
  onTabChange,
  systemNotifications,
  userNotifications,
  isLoadingSystem,
  isLoadingUsers,
  errorSystem,
  errorUsers,
  onMarkAsRead,
  onDelete,
}: NotificationTabsProps) {
  const systemUnreadCount = systemNotifications.filter((n) => !n.read).length;
  const userUnreadCount = userNotifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="flex border-b bg-gray-50 sticky top-0">
        <button
          onClick={() => onTabChange('sistema')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'sistema'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Sistema</span>
            {systemUnreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {systemUnreadCount}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => onTabChange('usuarios')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'usuarios'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            <span>De Usuarios</span>
            {userUnreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {userUnreadCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'sistema' && (
          <div>
            {isLoadingSystem && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
                  <p className="mt-2 text-sm text-gray-600">Cargando notificaciones del sistema...</p>
                </div>
              </div>
            )}

            {errorSystem && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md m-2">
                Error: {errorSystem}
              </div>
            )}

            {!isLoadingSystem && systemNotifications.length === 0 && !errorSystem && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No hay notificaciones del sistema</p>
              </div>
            )}

            {!isLoadingSystem && systemNotifications.length > 0 && (
              <div className="space-y-px">
                {systemNotifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div>
            {isLoadingUsers && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
                  <p className="mt-2 text-sm text-gray-600">Cargando notificaciones de usuarios...</p>
                </div>
              </div>
            )}

            {errorUsers && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md m-2">
                Error: {errorUsers}
              </div>
            )}

            {!isLoadingUsers && userNotifications.length === 0 && !errorUsers && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No hay notificaciones de otros usuarios</p>
              </div>
            )}

            {!isLoadingUsers && userNotifications.length > 0 && (
              <div className="space-y-px">
                {userNotifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
