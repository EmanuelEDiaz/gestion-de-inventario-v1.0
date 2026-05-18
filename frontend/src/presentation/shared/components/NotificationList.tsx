'use client';

import React from 'react';
import { NotificationTabs, type TabType } from './NotificationTabs';
import { PreferencesPanel } from './PreferencesPanel';
import { INotification } from '@/core/entities/notification';

interface NotificationListProps {
  showPreferences: boolean;
  onClosePreferences: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  systemNotifications: INotification[];
  userNotifications: INotification[];
  isLoadingSystem: boolean;
  isLoadingUsers: boolean;
  errorSystem?: string;
  errorUsers?: string;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationList({
  showPreferences,
  onClosePreferences,
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
}: NotificationListProps) {
  if (showPreferences) {
    return <PreferencesPanel onClose={onClosePreferences} />;
  }

  return (
    <NotificationTabs
      activeTab={activeTab}
      onTabChange={onTabChange}
      systemNotifications={systemNotifications}
      userNotifications={userNotifications}
      isLoadingSystem={isLoadingSystem}
      isLoadingUsers={isLoadingUsers}
      errorSystem={errorSystem}
      errorUsers={errorUsers}
      onMarkAsRead={onMarkAsRead}
      onDelete={onDelete}
    />
  );
}
