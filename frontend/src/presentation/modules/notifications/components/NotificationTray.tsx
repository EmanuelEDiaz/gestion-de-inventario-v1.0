'use client';

import { useState, useEffect } from 'react';
import { Notifications, NotificationsFill } from '@material-symbols-svg/react';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { useUnreadCount } from '../hooks/useNotifications';
import { useNotificationStream } from '../hooks/useNotificationStream';
import { ComposeMessageDialog } from './ComposeMessageDialog';
import { TrayHeader } from './TrayHeader';
import { TrayList } from './TrayList';
import { TrayFooter } from './TrayFooter';
import { cn } from '@/presentation/shared/lib/utils';

type Tab = 'SYSTEM' | 'USER';

export function NotificationTray() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('SYSTEM');
  const [composeOpen, setComposeOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();

  useNotificationStream();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <>
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

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-96',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Panel de notificaciones"
        aria-modal="true"
      >
        <TrayHeader unreadCount={unreadCount} onClose={() => setIsOpen(false)} />
        <TrayList
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCompose={() => setComposeOpen(true)}
        />
        <TrayFooter onClose={() => setIsOpen(false)} />
      </div>

      <ComposeMessageDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
    </>
  );
}
