'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Dialog } from '@/presentation/shared/components/ui/Dialog';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';

const MapViewer = dynamic(() => import('./MapViewer').then(m => m.MapViewer), { ssr: false });

interface MapPickerModalProps {
  open: boolean;
  province?: string;
  municipality?: string;
  initialLocation?: { lat: number; lng: number };
  onSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}

export function MapPickerModal({
  open,
  province,
  municipality,
  initialLocation,
  onSelect,
  onClose,
}: MapPickerModalProps) {
  void province; void municipality;
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleLocationSelect = useCallback((coords: { lat: number; lng: number }) => {
    setSelectedLocation(coords);
  }, []);

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(selectedLocation.lat, selectedLocation.lng);
    }
    onClose();
  };

  const handleClose = () => {
    setSelectedLocation(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Seleccionar Ubicación"
      description="Haz clic en el mapa o busca un lugar para seleccionar una ubicación"
      size="xl"
    >
      <div className="space-y-4">
        {selectedLocation && (
          <p className="text-sm text-muted-foreground">
            Ubicación seleccionada: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
        )}

        <MapViewer
          mode="select"
          initialCenter={initialLocation}
          initialZoom={initialLocation ? 15 : 8}
          onLocationSelect={handleLocationSelect}
          height="h-96"
          showLocate
          showZoomControls
        />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <TooltipWrapper content={selectedLocation ? 'Confirmar ubicación seleccionada' : 'Selecciona una ubicación en el mapa primero'}>
            <Button onClick={handleConfirm} disabled={!selectedLocation}>
              Seleccionar
            </Button>
          </TooltipWrapper>
        </div>
      </div>
    </Dialog>
  );
}
