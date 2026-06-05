'use client';

import { MapIcon, Download, AlertTriangle, Crosshair } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';

type MapStatus = 'not_downloaded' | 'downloading' | 'error' | 'no_permission';

interface MapStatusOverlayProps {
  status: MapStatus;
  progress?: number;
  onDownload?: () => void;
}

export function MapStatusOverlay({ status, progress, onDownload }: MapStatusOverlayProps) {
  switch (status) {
    case 'not_downloaded':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <MapIcon className="h-12 w-12" />
          <p className="text-sm">Mapa no disponible</p>
          {onDownload && (
            <TooltipWrapper content="Descargar mapa desde Configuración">
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-1" />
                Descargar mapa
              </Button>
            </TooltipWrapper>
          )}
        </div>
      );
    case 'downloading':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <p className="text-sm text-muted-foreground">Descargando mapa...</p>
          {progress !== undefined && (
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">{progress}%</p>
        </div>
      );
    case 'error':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-destructive">
          <AlertTriangle className="h-12 w-12" />
          <p className="text-sm">Error al cargar el mapa</p>
        </div>
      );
    case 'no_permission':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <Crosshair className="h-12 w-12" />
          <p className="text-sm">Permiso GPS denegado</p>
        </div>
      );
  }
}
