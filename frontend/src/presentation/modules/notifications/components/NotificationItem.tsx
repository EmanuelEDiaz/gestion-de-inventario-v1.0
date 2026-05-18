'use client';

import type { Notification } from '@/core/entities/notification';
import { getCategoryLabel } from '@/core/entities/notification';
import { cn } from '@/presentation/shared/lib/utils';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { CheckBox, CheckBoxOutlineBlank, MarkEmailRead, Delete } from '@material-symbols-svg/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  notification: Notification;
  isSelected: boolean;
  onToggleSelect: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  LOW_STOCK: 'bg-orange-100 text-orange-700',
  SYSTEM: 'bg-gray-100 text-gray-600',
  SALE: 'bg-success/10 text-success',
  PURCHASE: 'bg-info/10 text-info',
  SYNC: 'bg-purple-100 text-purple-700',
};

export function NotificationItem({ notification, isSelected, onToggleSelect, onMarkRead, onDelete }: Props) {
  const { title, body, category, createdAt, read, source, createdByName } = notification;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: es });

  return (
    <div className={cn('flex items-start gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors', !read && 'bg-blue-50/40')}>
      <TooltipWrapper content={isSelected ? 'Deseleccionar' : 'Seleccionar'} side="right">
        <button
          onClick={onToggleSelect}
          className="mt-0.5 shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label={isSelected ? 'Deseleccionar' : 'Seleccionar'}
        >
          {isSelected
            ? <CheckBox className="w-5 h-5 text-primary" />
            : <CheckBoxOutlineBlank className="w-5 h-5" />}
        </button>
      </TooltipWrapper>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          {!read && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" aria-label="No leída" />}
          <span className={cn('rounded px-1.5 py-px text-[10px] font-medium leading-4', CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-600')}>
            {getCategoryLabel(category)}
          </span>
          <span className="text-xs text-gray-400 ml-auto shrink-0">{timeAgo}</span>
        </div>
        {source === 'USER' && createdByName && (
          <p className="text-[11px] text-primary font-medium mb-0.5">De: {createdByName}</p>
        )}
        <p className="text-sm font-medium text-gray-800 leading-snug">{title}</p>
        {body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{body}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {!read && (
          <TooltipWrapper content="Marcar como leída" side="left">
            <button
              onClick={onMarkRead}
              className="rounded p-1 text-gray-400 hover:bg-primary/10 hover:text-primary transition-colors"
              aria-label="Marcar como leída"
            >
              <MarkEmailRead className="h-4 w-4" />
            </button>
          </TooltipWrapper>
        )}
        <TooltipWrapper content="Eliminar notificación" side="left">
          <button
            onClick={onDelete}
            className="rounded p-1 text-gray-400 hover:bg-danger/10 hover:text-danger transition-colors"
            aria-label="Eliminar notificación"
          >
            <Delete className="h-4 w-4" />
          </button>
        </TooltipWrapper>
      </div>
    </div>
  );
}
