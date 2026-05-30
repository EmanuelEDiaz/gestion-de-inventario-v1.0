'use client';

import { Loader2 } from 'lucide-react';

export function MapSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-lg border border-dashed">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">Cargando mapa...</p>
      <div className="mt-4 w-48 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary/40 rounded-full animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  );
}
