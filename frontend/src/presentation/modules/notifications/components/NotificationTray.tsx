'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Notifications, NotificationsFill, Close, OpenInNew, Edit } from '@material-symbols-svg/react';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { useUnreadCount } from '../hooks/useNotifications';
import { useNotificationStream } from '../hooks/useNotificationStream';
import { NotificationInbox } from './NotificationInbox';
import { ComposeMessageDialog } from './ComposeMessageDialog';
import { cn } from '@/presentation/shared/lib/utils';

type Tab = 'SYSTEM' | 'USER';

export function NotificationTray() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('SYSTEM');
  const [composeOpen, setComposeOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();

  // Real-time updates via SSE when tray is open
  useNotificationStream();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <>
      {/* Bell button */}
      <TooltipWrapper content={isOpen ? 'Cerrar notificaciones' : 'Notificaciones'} side="bottom">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
          aria-expanded={isOpen}
        >
          {isOpen
            ? <NotificationsFill className="h-6 w-6" />
            : <Notifications className="h-6 w-6" />}
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none"
              aria-hidden="true"
            >
              {badgeLabel}
            </span>
          )}
        </button>
      </TooltipWrapper>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sliding drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-96',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Panel de notificaciones"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 shrink-0">
          <h2 className="flex-1 text-base font-semibold text-gray-900">
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                {unreadCount}
              </span>
            )}
          </h2>
          <TooltipWrapper content="Ver todas las notificaciones" side="bottom">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="rounded p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Ir a página de notificaciones"
            >
              <OpenInNew className="h-4 w-4" />
            </Link>
          </TooltipWrapper>
          <TooltipWrapper content="Cerrar" side="bottom">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Cerrar panel"
            >
              <Close className="h-4 w-4" />
            </button>
          </TooltipWrapper>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 px-1 shrink-0">
          <button
            onClick={() => setActiveTab('SYSTEM')}
            title="Ver notificaciones del sistema"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'SYSTEM'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sistema
          </button>
          <button
            onClick={() => setActiveTab('USER')}
            title="Ver mensajes de otros usuarios"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'USER'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mensajes
          </button>
          {activeTab === 'USER' && (
            <TooltipWrapper content="Redactar nuevo mensaje" side="bottom">
              <button
                onClick={() => setComposeOpen(true)}
                title="Redactar nuevo mensaje"
                className="ml-auto mr-1 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                aria-label="Redactar mensaje"
              >
                <Edit className="h-4 w-4" />
              </button>
            </TooltipWrapper>
          )}
        </div>

        {/* Scrollable notification list */}
        <div className="flex-1 overflow-y-auto">
          <NotificationInbox includeRead={false} sourceFilter={activeTab} />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 shrink-0 text-center">
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Ver todas las notificaciones →
          </Link>
        </div>
      </div>

      <ComposeMessageDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
    </>
  );
}
