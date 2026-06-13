'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from '@/presentation/shared/components/ui/icon-mapping';

export default function OfflinePage() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <WifiOff className="size-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Sin conexión</h1>
      <p className="text-muted-foreground max-w-md">
        No tienes conexión a internet. Las funciones que requieren el servidor
        no estarán disponibles hasta que te reconectes.
      </p>
      {online && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Ya estás en línea — puedes navegar con normalidad.
        </p>
      )}
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <RefreshCw className="size-4" />
        Reintentar
      </button>
    </div>
  );
}
