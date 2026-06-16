'use client';

import { type ReactNode } from 'react';
import { AlertTriangle } from '@/presentation/shared/components/ui/icon-mapping';
import { Button } from '@/presentation/shared/components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  footer?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  footer,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            variant === 'destructive' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <AlertTriangle className={`h-5 w-5 ${
              variant === 'destructive' ? 'text-red-600' : 'text-blue-600'
            }`} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <p className="mb-6 text-sm text-gray-600">{description}</p>
        {footer ?? (
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              {cancelLabel}
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={onConfirm}
              className="flex-1"
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
