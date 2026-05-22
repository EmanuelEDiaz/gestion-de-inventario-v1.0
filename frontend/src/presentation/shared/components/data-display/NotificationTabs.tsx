'use client';

import React from 'react';
import { Notification } from '@/core/notification/entities/notification';
import { SystemTab } from '../SystemTab';
import { UsersTab } from '../UsersTab';
import { AlertCircle, Users } from '@/presentation/shared/components/ui/icon-mapping';

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
  activeTab, onTabChange, systemNotifications, userNotifications,
  isLoadingSystem, isLoadingUsers, errorSystem, errorUsers, onMarkAsRead, onDelete,
}: NotificationTabsProps) {
  const systemUnreadCount = systemNotifications.filter((n) => !n.read).length;
  const userUnreadCount = userNotifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b bg-gray-50 sticky top-0">
        <button
          onClick={() => onTabChange('sistema')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'sistema' ? 'border-primary text-primary bg-card' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Sistema</span>
            {systemUnreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{systemUnreadCount}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => onTabChange('usuarios')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'usuarios' ? 'border-primary text-primary bg-card' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            <span>De Usuarios</span>
            {userUnreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{userUnreadCount}</span>
            )}
          </div>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'sistema' && (
          <SystemTab notifications={systemNotifications} isLoading={isLoadingSystem} error={errorSystem} onMarkAsRead={onMarkAsRead} onDelete={onDelete} />
        )}
        {activeTab === 'usuarios' && (
          <UsersTab notifications={userNotifications} isLoading={isLoadingUsers} error={errorUsers} onMarkAsRead={onMarkAsRead} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
}
