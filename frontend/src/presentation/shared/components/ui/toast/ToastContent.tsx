'use client';

import { useState } from 'react';
import { Copy, Check } from '@/presentation/shared/components/ui/icon-mapping';
import { cn } from '@/presentation/shared/lib/utils';
import { TOAST_ICONS, TOAST_COLORS, type ToastVariant } from './ToastIcons';

export interface ToastContentProps {
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  statusCode?: number;
  action?: string;
  requiredPermission?: string;
  showCopyButton?: boolean;
}

export function ToastContent({
  title,
  description,
  variant,
  duration,
  statusCode,
  action,
  requiredPermission,
  showCopyButton = true,
}: ToastContentProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = TOAST_ICONS[variant];

  const handleCopy = async () => {
    const text = [
      statusCode && `Código de estado: ${statusCode}`,
      action && `Acción intentada: "${action}"`,
      requiredPermission && `Permiso requerido: ${requiredPermission}`,
      title,
      description,
    ].filter(Boolean).join('\n');
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn('flex flex-col', TOAST_COLORS[variant])}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="h-1 w-full bg-black/10">
        <div
          className="h-full bg-white/50"
          style={{ animation: isPaused ? 'none' : `shrink ${duration}ms linear forwards` }}
        />
      </div>
      <div className="flex items-start gap-3 p-4">
        <Icon />
        <div className="flex-1 min-w-0 space-y-1">
          {statusCode && (
            <p className="text-xs font-mono opacity-75">{statusCode} - {variant === 'error' ? 'Forbidden' : 'Error'}</p>
          )}
          <p className="font-medium text-sm">{title}</p>
          {description && <p className="text-sm opacity-90">{description}</p>}
          {action && <p className="text-xs opacity-75 mt-1">Acción: &quot;{action}&quot;</p>}
          {requiredPermission && <p className="text-xs opacity-75">Permiso: {requiredPermission}</p>}
        </div>
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
            title="Copiar detalles del error"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}