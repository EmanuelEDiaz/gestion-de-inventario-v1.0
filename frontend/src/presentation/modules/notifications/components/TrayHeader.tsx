'use client';

import React from 'react';
import Link from 'next/link';
import { OpenInNew, Close } from '@material-symbols-svg/react';
import { TooltipWrapper } from '@/presentation/shared/components/ui';

interface TrayHeaderProps {
  unreadCount: number;
  onClose: () => void;
}

export function TrayHeader({ unreadCount, onClose }: TrayHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 shrink-0">
      <h2 className="flex-1 text-base font-semibold text-gray-900">
        Notificaciones
        {unreadCount > 0 && (
          <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
            {unreadCount}
          </span>
        )}
      </h2>
      <TooltipWrapper content="Ver todas las notificaciones" side="bottom">
        <Link
          href="/notifications"
          onClick={onClose}
          className="rounded p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Ir a página de notificaciones"
        >
          <OpenInNew className="h-4 w-4" />
        </Link>
      </TooltipWrapper>
      <TooltipWrapper content="Cerrar" side="bottom">
        <button
          onClick={onClose}
          className="rounded p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Cerrar panel"
        >
          <Close className="h-4 w-4" />
        </button>
      </TooltipWrapper>
    </div>
  );
}
