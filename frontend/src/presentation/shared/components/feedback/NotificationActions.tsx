'use client';

import React from 'react';
import { Trash2, Check } from '@/presentation/shared/components/ui/icon-mapping';

interface NotificationActionsProps {
  read: boolean;
  onMarkAsRead: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function NotificationActions({ read, onMarkAsRead, onDelete }: NotificationActionsProps) {
  return (
    <div className="flex gap-2">
      {!read && (
        <button
          onClick={onMarkAsRead}
          title="Marcar como leída"
          className="p-1 hover:bg-success/5 rounded text-success transition-colors"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={onDelete}
        title="Eliminar"
        className="p-1 hover:bg-danger/5 rounded text-danger transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
