'use client';

import { useState } from 'react';
import { useNotificationStream } from '../hooks/useNotificationStream';
import { NotificationInbox } from '../components/NotificationInbox';

export function NotificationsView() {
  const [includeRead, setIncludeRead] = useState(false);

  useNotificationStream();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Notificaciones</h1>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeRead}
            onChange={(e) => setIncludeRead(e.target.checked)}
            className="rounded"
          />
          Mostrar leídas
        </label>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <NotificationInbox includeRead={includeRead} />
      </div>
    </div>
  );
}
