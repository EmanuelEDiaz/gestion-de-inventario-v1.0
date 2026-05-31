'use client';

import { useState } from 'react';
import { Edit } from '@material-symbols-svg/react';
import { Button, TooltipWrapper } from '@/presentation/shared/components/ui';
import { useNotificationStream } from '../hooks/useNotificationStream';
import { NotificationInbox } from '../components/NotificationInbox';
import { ComposeMessageDialog } from '../components/ComposeMessageDialog';

type Tab = 'SYSTEM' | 'USER';

export function NotificationsView() {
  const [includeRead, setIncludeRead] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('SYSTEM');
  const [composeOpen, setComposeOpen] = useState(false);

  useNotificationStream();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Notificaciones</h1>
        <TooltipWrapper content="Mostrar/ocultar notificaciones ya leídas">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeRead}
              onChange={(e) => setIncludeRead(e.target.checked)}
              className="rounded"
            />
            Mostrar leídas
          </label>
        </TooltipWrapper>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex items-center gap-1 border-b border-gray-200">
        <TooltipWrapper content="Ver notificaciones del sistema">
          <button
            onClick={() => setActiveTab('SYSTEM')}
            title="Ver notificaciones del sistema"
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'SYSTEM'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Sistema
          </button>
        </TooltipWrapper>
        <TooltipWrapper content="Ver mensajes de otros usuarios">
          <button
            onClick={() => setActiveTab('USER')}
            title="Ver mensajes de otros usuarios"
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'USER'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensajes
          </button>
        </TooltipWrapper>

        {activeTab === 'USER' && (
          <TooltipWrapper content="Redactar nuevo mensaje para otro usuario">
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto mb-1"
              onClick={() => setComposeOpen(true)}
              title="Redactar nuevo mensaje para otro usuario"
            >
              <Edit className="mr-1.5 h-4 w-4" />
              Redactar
            </Button>
          </TooltipWrapper>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <NotificationInbox includeRead={includeRead} sourceFilter={activeTab} />
      </div>

      <ComposeMessageDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
}
