'use client';

import { Power, AlertTriangle } from '@/presentation/shared/components/ui/icon-mapping';

interface SessionExpiredBannerProps {
  onLoginClick: () => void;
}

export function SessionExpiredBanner({ onLoginClick }: SessionExpiredBannerProps) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-lg">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">
            Sesión expirada
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Tu sesión con el servidor expiró. Puedes seguir consultando los datos locales,
            pero necesitas iniciar sesión para sincronizar cambios.
          </p>
        </div>
        <button
          onClick={onLoginClick}
          className="flex shrink-0 items-center gap-1.5 rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
        >
          <Power className="h-3.5 w-3.5" />
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}
