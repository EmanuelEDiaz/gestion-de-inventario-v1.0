'use client';

import { useNotifications } from '../hooks/useNotifications';
import { useMarkRead } from '../hooks/useMarkRead';
import { NotificationItem } from './NotificationItem';

interface Props {
  includeRead?: boolean;
}

export function NotificationInbox({ includeRead = false }: Props) {
  const { data: notifications = [], isLoading } = useNotifications(includeRead);
  const { markAll } = useMarkRead();

  const unread = notifications.filter((n) => !n.read);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
        Cargando notificaciones…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {unread.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            title="Marcar todas las notificaciones como leídas"
          >
            Marcar todas como leídas
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-sm">
          No hay notificaciones
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
