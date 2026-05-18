/**
 * NotificationItem.tsx
 * 
 * Componente individual de notificación
 * - Muestra título, body, categoría, prioridad
 * - Acciones: marcar como leída, eliminar
 * - Responsive para móvil
 */

'use client';

import React from 'react';
import { Notification, getCategoryLabel, getPriorityColor } from '@/core/entities/notification';
import { Bell, Trash2, Check } from 'lucide-react';

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

  const formattedDate = new Date(notification.createdAt).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
      {/* Header: Categoría + Timestamp */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">
            {getCategoryLabel(notification.category)}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(notification.priority)}`}>
            {notification.priority}
          </span>
        </div>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>

      {/* Título */}
      <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
        {notification.title}
      </h4>

      {/* Body */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {notification.body}
      </p>

      {/* Footer: Tags + Acciones */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {notification.tags && notification.tags.length > 0 && (
            <>
              {notification.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
              {notification.tags.length > 2 && (
                <span className="text-xs text-gray-500">+{notification.tags.length - 2}</span>
              )}
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          {!notification.read && (
            <button
              onClick={handleMarkAsRead}
              title="Marcar como leída"
              className="p-1 hover:bg-success/5 rounded text-success transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            title="Eliminar"
            className="p-1 hover:bg-danger/5 rounded text-danger transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
