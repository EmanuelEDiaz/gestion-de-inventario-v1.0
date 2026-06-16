'use client';

import { ConfirmDialog } from '@/presentation/shared/components/ui/ConfirmDialog';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  pendingCount: number;
  onKeepData: () => void;
  onDeleteAll: () => void;
  onCancel: () => void;
}

export function LogoutConfirmDialog({ isOpen, pendingCount, onKeepData, onDeleteAll, onCancel }: LogoutConfirmDialogProps) {
  const hasPending = pendingCount > 0;

  if (!hasPending) {
    return (
      <ConfirmDialog
        open={isOpen}
        title="Cerrar sesión"
        description="Se limpiarán los datos de sesión pero los catálogos locales se conservarán. ¿Deseas continuar?"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        onConfirm={onKeepData}
        onCancel={onCancel}
      />
    );
  }

  return (
    <ConfirmDialog
      open={isOpen}
      title="Cambios sin sincronizar"
      description={
        <>
          Tienes <strong className="text-amber-700">{pendingCount} cambio{pendingCount > 1 ? 's' : ''}</strong> que
          no se ha{pendingCount > 1 ? 'n' : ''} subido al servidor.
          {' '}Si cierras sesión, los cambios pendientes se perderán si borras los datos locales.
        </>
      }
      variant="destructive"
      onConfirm={onDeleteAll}
      onCancel={onCancel}
      footer={
        <div className="flex flex-col gap-2">
          <button
            onClick={onKeepData}
            className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            Cerrar sesión y conservar datos
          </button>
          <button
            onClick={onDeleteAll}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Cerrar sesión y borrar todo
          </button>
        </div>
      }
    />
  );
}
