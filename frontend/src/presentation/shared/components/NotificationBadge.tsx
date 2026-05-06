/**
 * NotificationBadge.tsx
 * 
 * Componente para mostrar el contador de notificaciones no leídas
 * - Muestra número en la campanita
 * - Se actualiza en tiempo real con los hooks
 * - Desaparece cuando count = 0
 * - Versión mejorada del badge que ya estaba en NotificationPanel
 */

'use client';

import React from 'react';

interface NotificationBadgeProps {
  count: number;
  /**
   * CSS classes para personalizar el badge
   * @default "absolute top-0 right-0 h-5 w-5 bg-red-500"
   */
  className?: string;
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count === 0) {
    return null; // No mostrar badge si no hay notificaciones
  }

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={
        className ||
        'absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse'
      }
      title={`${count} notificaciones sin leer`}
    >
      {displayCount}
    </span>
  );
}
