'use client';

import { useState, useEffect } from 'react';
import { Send, Close } from '@material-symbols-svg/react';
import { Button, Input } from '@/presentation/shared/components/ui';
import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';
import { useUserDirectory } from '../hooks/useUserDirectory';
import { useSendMessage } from '../hooks/useSendMessage';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ComposeMessageDialog({ open, onClose }: Props) {
  const [targetUserId, setTargetUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data: users = [], isLoading: loadingUsers } = useUserDirectory();
  const sendMessage = useSendMessage();

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.displayName} (@${u.username})`,
  }));

  const canSend = targetUserId.trim() !== '' && title.trim() !== '' && body.trim() !== '';

  function resetForm() {
    setTargetUserId('');
    setTitle('');
    setBody('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSend() {
    if (!canSend) return;
    sendMessage.mutate(
      { title: title.trim(), body: body.trim(), targetUserId },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      }
    );
  }

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Redactar mensaje"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Nuevo mensaje</h2>
          <button
            onClick={handleClose}
            title="Cerrar"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="msg-to">
              Destinatario
            </label>
            <ComboboxSelect
              options={userOptions}
              value={targetUserId}
              onChange={setTargetUserId}
              placeholder={loadingUsers ? 'Cargando usuarios...' : 'Seleccionar usuario'}
              searchPlaceholder="Buscar usuario..."
              disabled={loadingUsers}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="msg-title">
              Asunto
            </label>
            <Input
              id="msg-title"
              title="Asunto del mensaje"
              placeholder="Ej: Consulta sobre stock"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="msg-body">
              Mensaje
            </label>
            <textarea
              id="msg-body"
              title="Cuerpo del mensaje"
              placeholder="Escribe tu mensaje aquí..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <p className="mt-0.5 text-right text-xs text-gray-400">{body.length}/1000</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <Button variant="ghost" size="sm" onClick={handleClose} title="Cancelar">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!canSend || sendMessage.isPending}
            title="Enviar mensaje"
          >
            <Send className="mr-1.5 h-4 w-4" />
            {sendMessage.isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
