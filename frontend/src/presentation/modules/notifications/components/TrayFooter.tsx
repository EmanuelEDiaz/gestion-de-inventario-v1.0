'use client';

import React from 'react';
import Link from 'next/link';

interface TrayFooterProps {
  onClose: () => void;
}

export function TrayFooter({ onClose }: TrayFooterProps) {
  return (
    <div className="border-t border-gray-100 p-3 shrink-0 text-center">
      <Link
        href="/notifications"
        onClick={onClose}
        className="text-sm text-primary hover:text-primary/80 transition-colors"
      >
        Ver todas las notificaciones →
      </Link>
    </div>
  );
}
