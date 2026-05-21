'use client';

import { DoneAll, Delete } from '@material-symbols-svg/react';
import { TooltipWrapper } from '@/presentation/shared/components/ui';

interface InboxFilterBarProps {
  selectedCount: number;
  unreadCount: number;
  onMarkSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  onMarkAll: () => void;
  deleteManyPending: boolean;
  markAllPending: boolean;
}

export function InboxFilterBar({ selectedCount, unreadCount, onMarkSelected, onDeleteSelected, onClearSelection, onMarkAll, deleteManyPending, markAllPending }: InboxFilterBarProps) {
  return (
    <>
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100 text-sm">
          <span className="text-blue-700 font-medium flex-1">{selectedCount} seleccionadas</span>
          <TooltipWrapper content="Marcar seleccionadas como leídas">
            <button onClick={onMarkSelected} className="flex items-center gap-1 rounded px-2 py-1 text-primary hover:bg-primary/10 transition-colors" aria-label="Marcar leídas">
              <DoneAll className="h-4 w-4" /><span>Leídas</span>
            </button>
          </TooltipWrapper>
          <TooltipWrapper content="Eliminar seleccionadas">
            <button onClick={onDeleteSelected} disabled={deleteManyPending} className="flex items-center gap-1 rounded px-2 py-1 text-danger hover:bg-danger/5 transition-colors disabled:opacity-50" aria-label="Eliminar seleccionadas">
              <Delete className="h-4 w-4" /><span>Eliminar</span>
            </button>
          </TooltipWrapper>
          <button onClick={onClearSelection} className="text-gray-400 hover:text-gray-700 px-1">✕</button>
        </div>
      )}

      {selectedCount === 0 && unreadCount > 0 && (
        <div className="flex justify-end px-3 py-2 border-b border-gray-100">
          <TooltipWrapper content="Marcar todas las notificaciones como leídas">
            <button onClick={onMarkAll} disabled={markAllPending} className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:opacity-50" aria-label="Marcar todas como leídas">
              <DoneAll className="h-4 w-4" />Marcar todas leídas
            </button>
          </TooltipWrapper>
        </div>
      )}
    </>
  );
}
