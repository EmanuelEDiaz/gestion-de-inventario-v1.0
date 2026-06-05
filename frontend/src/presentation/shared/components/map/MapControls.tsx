'use client';

import { Plus, Minus, Crosshair, Maximize2, Minimize2 } from 'lucide-react';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { cn } from '@/presentation/shared/lib/utils';
import { useCallback, useState } from 'react';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate?: () => void;
  showZoom?: boolean;
  showLocate?: boolean;
  showFullscreen?: boolean;
  mapContainerId?: string;
  locating?: boolean;
}

export function MapControls({ 
  onZoomIn, onZoomOut, onLocate,
  showZoom = true, showLocate = true, showFullscreen = true,
  mapContainerId = 'map-container',
  locating = false,
}: MapControlsProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.getElementById(mapContainerId)?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, [mapContainerId]);

  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1">
      {showZoom && (
        <>
          <TooltipWrapper content="Acercar">
            <button
              onClick={onZoomIn}
              className={cn(
                'min-h-11 min-w-11 flex items-center justify-center',
                'bg-background border rounded-lg shadow-sm',
                'hover:bg-accent transition-colors'
              )}
              aria-label="Acercar"
            >
              <Plus className="h-5 w-5" />
            </button>
          </TooltipWrapper>
          <TooltipWrapper content="Alejar">
            <button
              onClick={onZoomOut}
              className={cn(
                'min-h-11 min-w-11 flex items-center justify-center',
                'bg-background border rounded-lg shadow-sm',
                'hover:bg-accent transition-colors'
              )}
              aria-label="Alejar"
            >
              <Minus className="h-5 w-5" />
            </button>
          </TooltipWrapper>
        </>
      )}
      {showLocate && (
        <TooltipWrapper content="Mi ubicación">
          <button
            onClick={onLocate}
            disabled={locating}
            className={cn(
              'min-h-11 min-w-11 flex items-center justify-center',
              'bg-background border rounded-lg shadow-sm',
              'hover:bg-accent transition-colors',
              locating && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Mi ubicación"
          >
            <Crosshair className="h-5 w-5" />
          </button>
        </TooltipWrapper>
      )}
      {showFullscreen && (
        <TooltipWrapper content={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
          <button
            onClick={toggleFullscreen}
            className={cn(
              'min-h-11 min-w-11 flex items-center justify-center',
              'bg-background border rounded-lg shadow-sm',
              'hover:bg-accent transition-colors'
            )}
            aria-label="Pantalla completa"
          >
            {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </TooltipWrapper>
      )}
    </div>
  );
}
