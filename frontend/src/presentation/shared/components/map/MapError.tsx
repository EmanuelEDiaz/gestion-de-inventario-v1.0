'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';

interface MapErrorProps {
  onRetry: () => void;
  message?: string;
}

export function MapError({ onRetry, message }: MapErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-lg border border-dashed gap-3">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-destructive font-medium">
        {message ?? 'Error al cargar el mapa'}
      </p>
      <TooltipWrapper content="Reintentar carga del mapa">
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </TooltipWrapper>
    </div>
  );
}
