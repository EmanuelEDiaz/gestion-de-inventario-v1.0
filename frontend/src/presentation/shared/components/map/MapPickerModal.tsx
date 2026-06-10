'use client';

import { useState, useCallback } from 'react';
import { Dialog } from '@/presentation/shared/components/ui/Dialog';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { MapContainer } from './MapContainer';
import type { MapLocation, GeoEntry } from '@/core/maps/entities/map-location';
import type { IGeoSearchAdapter } from '@/core/maps/ports/IGeoSearchAdapter';

interface MapPickerModalProps {
  open: boolean;
  province?: string;
  municipality?: string;
  initialLocation?: MapLocation;
  geoSearchAdapter?: IGeoSearchAdapter;
  onSelect: (lat: number, lng: number, entry?: GeoEntry) => void;
  onClose: () => void;
}

export function MapPickerModal({
  open,
  province,
  municipality,
  initialLocation,
  geoSearchAdapter,
  onSelect,
  onClose,
}: MapPickerModalProps) {
  void province; void municipality;
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<GeoEntry | undefined>();

  const handleLocationSelect = useCallback((location: MapLocation, entry?: GeoEntry) => {
    setSelectedLocation(location);
    setSelectedEntry(entry);
  }, []);

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(selectedLocation.lat, selectedLocation.lng, selectedEntry);
    }
    onClose();
  };

  const handleClose = () => {
    setSelectedLocation(null);
    setSelectedEntry(undefined);
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

        <MapContainer
          center={initialLocation}
          zoom={initialLocation ? 15 : 8}
          geoSearchAdapter={geoSearchAdapter}
          readonly={false}
          onLocationSelect={handleLocationSelect}
          searchEnabled={true}
          controlsEnabled={true}
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
