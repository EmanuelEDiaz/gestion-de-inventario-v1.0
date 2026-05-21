'use client';

import { AlertTriangle } from 'lucide-react';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  pendingCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmDialog({ isOpen, pendingCount, onConfirm, onCancel }: LogoutConfirmDialogProps) {
  if (!isOpen) return null;

  const hasPending = pendingCount > 0;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {hasPending ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Cambios sin sincronizar</h2>
            </div>
            <p className="mb-2 text-sm text-gray-600">
              Tienes <strong className="text-amber-700">{pendingCount} cambio{pendingCount > 1 ? 's' : ''}</strong> que
              no se ha{pendingCount > 1 ? 'n' : ''} subido al servidor.
            </p>
            <p className="mb-6 text-sm text-danger font-medium">
              Si cierras sesión ahora, estos cambios se perderán permanentemente.
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Cerrar sesión</h2>
            <p className="mb-6 text-sm text-gray-600">
              Todos los datos locales se eliminarán. ¿Deseas continuar?
            </p>
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white ${
              hasPending
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {hasPending ? 'Cerrar sesión y perder cambios' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
