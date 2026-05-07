'use client';

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { ToastContent } from './ToastContent';
import type { ToastVariant } from './ToastIcons';

export { ToastContent } from './ToastContent';

/**
 * Toaster container - include once in root layout
 */
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

interface ToastOptions {
  description?: string;
  duration?: number;
}

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  error: 5000,
  success: 4000,
  warning: 5000,
  info: 4000,
};

function showToast(variant: ToastVariant, title: string, options?: ToastOptions) {
  const duration = options?.duration ?? DEFAULT_DURATIONS[variant];
  sonnerToast.custom(
    () => <ToastContent title={title} description={options?.description} variant={variant} duration={duration} />,
    { duration }
  );
}

/**
 * Toast notification functions with progress bar
 */
export const toast = {
  error: (title: string, options?: ToastOptions) => showToast('error', title, options),
  success: (title: string, options?: ToastOptions) => showToast('success', title, options),
  warning: (title: string, options?: ToastOptions) => showToast('warning', title, options),
  info: (title: string, options?: ToastOptions) => showToast('info', title, options),
};
