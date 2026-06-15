'use client';

import { Button } from '@/presentation/shared/components/ui/Button';

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <svg className="h-16 w-16 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <div>
        <h1 className="text-2xl font-bold">Sin conexión</h1>
        <p className="mt-2 text-muted-foreground">
          No hay conexión con el servidor. Puedes seguir trabajando con los datos locales.
        </p>
      </div>
      <Button onClick={() => location.reload()}>
        Reintentar
      </Button>
    </div>
  );
}
