'use client';

import React from 'react';
import { Send, Close } from '@material-symbols-svg/react';
import { Button } from '@/presentation/shared/components/ui';

interface MessagePreviewProps {
  onClose: () => void;
  onSend: () => void;
  canSend: boolean;
  isSending: boolean;
  children: React.ReactNode;
}

export function MessagePreview({
  onClose,
  onSend,
  canSend,
  isSending,
  children,
}: MessagePreviewProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Redactar mensaje"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Nuevo mensaje</h2>
          <button
            onClick={onClose}
            title="Cerrar"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose} title="Cancelar">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onSend}
            disabled={!canSend || isSending}
            title="Enviar mensaje"
          >
            <Send className="mr-1.5 h-4 w-4" />
            {isSending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
