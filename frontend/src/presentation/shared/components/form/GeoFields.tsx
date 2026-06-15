'use client';

import { useState } from 'react';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import { MapPin } from '@/presentation/shared/components/ui/icon-mapping';
import { MapPickerModal } from '@/presentation/shared/components/map/MapPickerModal';
import { useProvinces } from '@/presentation/modules/geo/hooks/useProvinces';
import { useMunicipalities } from '@/presentation/modules/geo/hooks/useMunicipalities';

interface GeoFieldsProps {
  province: string;
  municipality: string;
  street: string;
  locality: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  onChange: (name: string, value: string) => void;
  errors?: Record<string, string>;
}

export function GeoFields({
  province, municipality, street, locality, zipCode,
  latitude, longitude, onChange, errors,
}: GeoFieldsProps) {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const { data: provinces } = useProvinces();
  const { data: municipalities } = useMunicipalities(province || undefined);

  const fieldError = (name: string) => errors?.[name];

  return (
    <>
      <div className="space-y-1 sm:col-span-2">
        <label className="text-sm font-medium">
          <span className="inline-flex items-center gap-1">Dirección estructurada <TooltipHint title="Dirección estructurada" description="Provincia, municipio, calle y código postal" /></span>
        </label>
      </div>
      <div className="space-y-1">
        <label htmlFor="province" className="text-sm font-medium">Provincia</label>
        <select
          id="province"
          value={province}
          onChange={(e) => onChange('province', e.target.value)}
          className={`flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${fieldError('province') ? 'border-red-500' : ''}`}
        >
          <option value="">Seleccionar provincia</option>
          {provinces?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {fieldError('province') && <p className="text-xs text-red-500">{fieldError('province')}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor="municipality" className="text-sm font-medium">Municipio</label>
        <select
          id="municipality"
          value={municipality}
          onChange={(e) => onChange('municipality', e.target.value)}
          disabled={!province}
          className={`flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50 ${fieldError('municipality') ? 'border-red-500' : ''}`}
        >
          <option value="">Seleccionar municipio</option>
          {municipalities?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {fieldError('municipality') && <p className="text-xs text-red-500">{fieldError('municipality')}</p>}
      </div>
      <div className="space-y-1">
        <Input
          id="street" value={street}
          onChange={(e) => onChange('street', e.target.value)}
          placeholder="Calle #123" title="Calle y número"
        />
        {fieldError('street') && <p className="text-xs text-red-500">{fieldError('street')}</p>}
      </div>
      <div className="space-y-1">
        <Input
          id="locality" value={locality}
          onChange={(e) => onChange('locality', e.target.value)}
          placeholder="Reparto/Comunidad" title="Reparto o comunidad"
        />
        {fieldError('locality') && <p className="text-xs text-red-500">{fieldError('locality')}</p>}
      </div>
      <div className="space-y-1">
        <Input
          id="zipCode" value={zipCode}
          onChange={(e) => onChange('zipCode', e.target.value)}
          placeholder="Código Postal" title="Código postal"
        />
        {fieldError('zipCode') && <p className="text-xs text-red-500">{fieldError('zipCode')}</p>}
      </div>
      <div className="sm:col-span-2 flex items-center gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setShowMapPicker(true)}>
          <MapPin className="h-4 w-4 mr-1" /> Seleccionar en Mapa
        </Button>
        {latitude && longitude && (
          <span className="text-xs text-muted-foreground">
            Coordenadas: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
          </span>
        )}
      </div>
      <MapPickerModal
        open={showMapPicker}
        province={province}
        municipality={municipality}
        initialLocation={latitude && longitude ? { lat: parseFloat(latitude), lng: parseFloat(longitude) } : undefined}
        onSelect={(lat, lng) => {
          onChange('latitude', lat.toString());
          onChange('longitude', lng.toString());
          setShowMapPicker(false);
        }}
        onClose={() => setShowMapPicker(false)}
      />
    </>
  );
}
