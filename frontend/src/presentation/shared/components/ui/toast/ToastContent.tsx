'use client';

import { cn } from '@/presentation/shared/lib/utils';
import { TOAST_ICONS, TOAST_COLORS, type ToastVariant } from './ToastIcons';

interface ToastContentProps {
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

/**
 * Toast content with progress bar
 */
export function ToastContent({ title, description, variant, duration }: ToastContentProps) {
  const Icon = TOAST_ICONS[variant];

  return (
    <div className={cn('flex flex-col', TOAST_COLORS[variant])}>
      {/* Progress bar */}
      <div className="h-1 w-full bg-black/10">
        <div
          className="h-full bg-white/50"
          style={{
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
      
      {/* Content */}
      <div className="flex items-start gap-3 p-4">
        <Icon />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          {description && (
            <p className="text-sm opacity-90 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
