'use client';

import { Plus, Minus, Crosshair, Maximize2 } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { cn } from '@/presentation/shared/lib/utils';

interface MapControlsProps {
  mapInstance: LeafletMap | null;
  showZoom?: boolean;
  showLocate?: boolean;
  showFullscreen?: boolean;
}

export function MapControls({ mapInstance, showZoom = true, showLocate = true, showFullscreen = true }: MapControlsProps) {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.getElementById('map-container')?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1">
      {showZoom && (
        <>
          <TooltipWrapper content="Acercar">
            <button
              onClick={() => mapInstance?.zoomIn()}
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
              onClick={() => mapInstance?.zoomOut()}
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
            onClick={() => mapInstance?.locate()}
            className={cn(
              'min-h-11 min-w-11 flex items-center justify-center',
              'bg-background border rounded-lg shadow-sm',
              'hover:bg-accent transition-colors'
            )}
            aria-label="Mi ubicación"
          >
            <Crosshair className="h-5 w-5" />
          </button>
        </TooltipWrapper>
      )}
      {showFullscreen && (
        <TooltipWrapper content="Pantalla completa">
          <button
            onClick={toggleFullscreen}
            className={cn(
              'min-h-11 min-w-11 flex items-center justify-center',
              'bg-background border rounded-lg shadow-sm',
              'hover:bg-accent transition-colors'
            )}
            aria-label="Pantalla completa"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </TooltipWrapper>
      )}
    </div>
  );
}
