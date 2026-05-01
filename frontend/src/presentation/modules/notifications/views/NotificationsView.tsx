'use client';

import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationStream } from '../hooks/useNotificationStream';
import { NotificationInbox } from '../components/NotificationInbox';

export function NotificationsView() {
  const [includeRead, setIncludeRead] = useState(false);

  // Conectar SSE para actualizaciones en tiempo real
  useNotificationStream();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Notificaciones</h1>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeRead}
            onChange={(e) => setIncludeRead(e.target.checked)}
            title="Mostrar también las notificaciones ya leídas"
          />
          Mostrar leídas
        </label>
      </div>
      <NotificationInbox includeRead={includeRead} />
    </div>
  );
}
