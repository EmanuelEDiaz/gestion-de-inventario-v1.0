'use client';

import { MapIcon, Download } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';

interface MapEmptyProps {
  message?: string;
  onDownload?: () => void;
}

export function MapEmpty({ message, onDownload }: MapEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-lg border border-dashed gap-3">
      <MapIcon className="h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {message ?? 'No hay datos de mapa disponibles para esta región.'}
      </p>
      {onDownload && (
        <TooltipWrapper content="Descargar mapa para uso offline">
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descargar ahora
          </Button>
        </TooltipWrapper>
      )}
    </div>
  );
}
