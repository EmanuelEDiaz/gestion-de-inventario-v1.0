'use client';

import { useState, useCallback } from 'react';
import { DoneAll, Delete } from '@material-symbols-svg/react';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { NotificationItem } from './NotificationItem';
import { SkeletonList } from '@/presentation/shared/components/data-display/Skeleton';
import { TooltipWrapper } from '@/presentation/shared/components/ui';

interface Props {
  includeRead?: boolean;
  sourceFilter?: 'SYSTEM' | 'USER';
}

export function NotificationInbox({ includeRead = false, sourceFilter }: Props) {
  const { data: allNotifications = [], isLoading } = useNotifications(includeRead);
  const { markOne, markAll, deleteOne, deleteMany } = useNotificationActions();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const notifications = sourceFilter
    ? allNotifications.filter((n) => n.source === sourceFilter)
    : allNotifications;

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = () => setSelected(new Set());

  const handleMarkSelected = () => {
    const ids = [...selected].filter((id) => notifications.find((n) => n.id === id && !n.read));
    Promise.all(ids.map((id) => markOne.mutate(id)));
    clearSelection();
  };

  const handleDeleteSelected = () => {
    deleteMany.mutate([...selected], { onSuccess: clearSelection });
  };

  if (isLoading) return <SkeletonList count={5} />;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100 text-sm">
          <span className="text-blue-700 font-medium flex-1">{selected.size} seleccionadas</span>
          <TooltipWrapper content="Marcar seleccionadas como leídas">
            <button onClick={handleMarkSelected} className="flex items-center gap-1 rounded px-2 py-1 text-primary hover:bg-primary/10 transition-colors" aria-label="Marcar leídas">
              <DoneAll className="h-4 w-4" /><span>Leídas</span>
            </button>
          </TooltipWrapper>
          <TooltipWrapper content="Eliminar seleccionadas">
            <button onClick={handleDeleteSelected} disabled={deleteMany.isPending} className="flex items-center gap-1 rounded px-2 py-1 text-danger hover:bg-danger/5 transition-colors disabled:opacity-50" aria-label="Eliminar seleccionadas">
              <Delete className="h-4 w-4" /><span>Eliminar</span>
            </button>
          </TooltipWrapper>
          <button onClick={clearSelection} className="text-gray-400 hover:text-gray-700 px-1">✕</button>
        </div>
      )}

      {/* Toolbar: mark-all */}
      {selected.size === 0 && unreadCount > 0 && (
        <div className="flex justify-end px-3 py-2 border-b border-gray-100">
          <TooltipWrapper content="Marcar todas las notificaciones como leídas">
            <button onClick={() => markAll.mutate()} disabled={markAll.isPending} className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:opacity-50" aria-label="Marcar todas como leídas">
              <DoneAll className="h-4 w-4" />Marcar todas leídas
            </button>
          </TooltipWrapper>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          {sourceFilter === 'USER' ? 'Sin mensajes recibidos' : 'Sin notificaciones'}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              isSelected={selected.has(n.id)}
              onToggleSelect={() => toggle(n.id)}
              onMarkRead={() => markOne.mutate(n.id)}
              onDelete={() => deleteOne.mutate(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
