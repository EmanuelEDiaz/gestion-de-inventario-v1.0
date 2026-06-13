'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Maximize2 } from '@/presentation/shared/components/ui/icon-mapping';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Dialog } from '@/presentation/shared/components/ui/Dialog';

const MapViewer = dynamic(() => import('./MapViewer').then(m => m.MapViewer), { ssr: false });

interface MapPreviewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  marker?: { lat: number; lng: number; label?: string };
  className?: string;
  static?: boolean;
}

export function MapPreview(props: MapPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className={`relative bg-muted rounded-lg overflow-hidden ${props.className ?? ''}`}
        style={{ minHeight: '176px' }}
      >
        <MapViewer
          mode="view"
          initialCenter={props.center}
          initialZoom={props.zoom ?? 10}
          markers={props.marker ? [{ id: 'preview', lat: props.marker.lat, lng: props.marker.lng, label: props.marker.label }] : undefined}
          height="100%"
          showLocate={false}
          showZoomControls={false}
        />
        {!props.static && (
          <div className="absolute top-2 right-2">
            <TooltipWrapper content="Expandir mapa">
              <Button variant="secondary" size="icon" onClick={() => setExpanded(true)} className="h-9 w-9">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
          </div>
        )}
      </div>

      <Dialog
        open={expanded}
        onClose={() => setExpanded(false)}
        title="Mapa"
        size="full"
      >
        <div className="h-[calc(80vh-80px)] w-full">
          <MapViewer
            mode="view"
            initialCenter={props.center}
            initialZoom={props.zoom ?? 10}
            markers={props.marker ? [{ id: 'preview', lat: props.marker.lat, lng: props.marker.lng, label: props.marker.label }] : undefined}
            height="100%"
            showLocate
            showZoomControls
          />
        </div>
      </Dialog>
    </>
  );
}
