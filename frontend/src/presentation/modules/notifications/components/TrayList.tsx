'use client';

import React from 'react';
import { Edit } from '@material-symbols-svg/react';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { NotificationInbox } from './NotificationInbox';

type Tab = 'SYSTEM' | 'USER';

interface TrayListProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onCompose: () => void;
}

export function TrayList({ activeTab, onTabChange, onCompose }: TrayListProps) {
  return (
    <>
      <div className="flex items-center border-b border-gray-100 px-1 shrink-0">
        <TooltipWrapper content="Ver notificaciones del sistema">
          <button
            onClick={() => onTabChange('SYSTEM')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
            onClick={() => onTabChange('USER')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'USER'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensajes
          </button>
        </TooltipWrapper>
        {activeTab === 'USER' && (
          <TooltipWrapper content="Redactar nuevo mensaje" side="bottom">
            <button
              onClick={onCompose}
              className="ml-auto mr-1 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary transition-colors"
              aria-label="Redactar mensaje"
            >
              <Edit className="h-4 w-4" />
            </button>
          </TooltipWrapper>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <NotificationInbox includeRead={false} sourceFilter={activeTab} />
      </div>
    </>
  );
}
