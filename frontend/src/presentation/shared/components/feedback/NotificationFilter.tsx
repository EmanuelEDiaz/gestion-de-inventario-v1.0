'use client';

import React from 'react';
import { Settings, CheckCheck } from '@/presentation/shared/components/ui/icon-mapping';

interface NotificationFilterProps {
  totalUnreadCount: number;
  onMarkAllAsRead: () => void;
  onShowPreferences: () => void;
  onClose: () => void;
}

export function NotificationFilter({
  totalUnreadCount,
  onMarkAllAsRead,
  onShowPreferences,
  onClose,
}: NotificationFilterProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
      <h2 className="text-lg font-bold text-gray-900">Notificaciones</h2>
      <div className="flex gap-2">
        <button
          onClick={onShowPreferences}
          title="Preferencias"
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Settings className="h-5 w-5 text-gray-600" />
        </button>
        {totalUnreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            title="Marcar todas como leídas"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <CheckCheck className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <button
          onClick={onClose}
          className="md:hidden p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
