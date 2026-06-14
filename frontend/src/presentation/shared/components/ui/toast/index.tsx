'use client';

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { getErrorMessage } from '@/infrastructure/api/client';
import { ToastContent } from './ToastContent';
import type { ToastVariant } from './ToastIcons';

export { ToastContent } from './ToastContent';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'group flex flex-col w-full max-w-sm rounded-lg shadow-lg overflow-hidden',
          title: 'font-medium text-sm',
          description: 'text-sm opacity-90',
        },
      }}
    />
  );
}

export interface ToastOptions {
  description?: string;
  duration?: number;
  statusCode?: number;
  action?: string;
  onAction?: () => void;
  requiredPermission?: string;
  showCopyButton?: boolean;
}

export interface PermissionDeniedOptions extends ToastOptions {
  action: string;
  requiredPermission: string;
}

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  error: 8000,
  success: 4000,
  warning: 6000,
  info: 4000,
};

function resolveTitle(titleOrError: string | Error): string {
  if (typeof titleOrError === 'string') return titleOrError;
  return getErrorMessage(titleOrError);
}

function showToast(variant: ToastVariant, title: string, options?: ToastOptions) {
  const duration = options?.duration ?? DEFAULT_DURATIONS[variant];
  sonnerToast.custom(
    () => (
      <ToastContent
        title={title}
        description={options?.description}
        variant={variant}
        duration={duration}
        statusCode={options?.statusCode}
        action={options?.action}
        onAction={options?.onAction}
        requiredPermission={options?.requiredPermission}
        showCopyButton={options?.showCopyButton ?? true}
      />
    ),
    { duration }
  );
}

export const toast = {
  error: (titleOrError: string | Error, options?: ToastOptions) => showToast('error', resolveTitle(titleOrError), options),
  success: (title: string, options?: ToastOptions) => showToast('success', title, options),
  warning: (title: string, options?: ToastOptions) => showToast('warning', title, options),
  info: (title: string, options?: ToastOptions) => showToast('info', title, options),
  
  permissionDenied: (options: PermissionDeniedOptions) => {
    const title = `No tienes permisos para "${options.action}"`;
    const description = options.description || 'Contacta al administrador si necesitas acceso.';
    showToast('error', title, {
      ...options,
      statusCode: options.statusCode || 403,
      description,
    });
  },
};