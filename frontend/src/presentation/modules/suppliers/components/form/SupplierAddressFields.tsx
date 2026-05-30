'use client';

import { Input } from '@/presentation/shared/components/ui/Input';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import { MapPin } from 'lucide-react';

interface ProvinceOption {
  id: string;
  name: string;
}

interface MunicipalityOption {
  id: string;
  name: string;
}

interface SupplierAddressFieldsProps {
  province: string;
  municipality: string;
  street: string;
  locality: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  provinces?: ProvinceOption[];
  municipalities?: MunicipalityOption[];
  onProvinceChange: (value: string) => void;
  onMunicipalityChange: (value: string) => void;
  onStreetChange: (value: string) => void;
  onLocalityChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onOpenMapPicker: () => void;
}

export function SupplierAddressFields({ province, municipality, street, locality, zipCode, latitude, longitude, provinces, municipalities, onProvinceChange, onMunicipalityChange, onStreetChange, onLocalityChange, onZipCodeChange, onLatitudeChange, onLongitudeChange, onOpenMapPicker }: SupplierAddressFieldsProps) {
  return (
    <>
      <div className="space-y-1 sm:col-span-2">
        <label className="text-sm font-medium">
          <span className="inline-flex items-center gap-1">Dirección <TooltipHint title="Dirección" description="Dirección del proveedor" /></span>
        </label>
      </div>
      <div className="space-y-1">
        <label htmlFor="province" className="text-sm font-medium">Provincia</label>
        <select id="province" value={province} onChange={(e) => onProvinceChange(e.target.value)}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
          <option value="">Seleccionar provincia</option>
          {provinces?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="municipality" className="text-sm font-medium">Municipio</label>
        <select id="municipality" value={municipality} onChange={(e) => onMunicipalityChange(e.target.value)}
          disabled={!province}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50">
          <option value="">Seleccionar municipio</option>
          {municipalities?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Input id="street" value={street} onChange={(e) => onStreetChange(e.target.value)}
          placeholder="Calle #123" title="Calle y número" />
      </div>
      <div className="space-y-1">
        <Input id="locality" value={locality} onChange={(e) => onLocalityChange(e.target.value)}
          placeholder="Reparto/Comunidad" title="Reparto o comunidad" />
      </div>
      <div className="space-y-1">
        <Input id="zipCode" value={zipCode} onChange={(e) => onZipCodeChange(e.target.value)}
          placeholder="Código Postal" title="Código postal" />
      </div>
      <div className="sm:col-span-2 flex items-center gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onOpenMapPicker}>
          <MapPin className="h-4 w-4 mr-1" /> Seleccionar en Mapa
        </Button>
        {latitude && longitude && (
          <span className="text-xs text-muted-foreground">
            Coordenadas: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
          </span>
        )}
      </div>
    </>
  );
}
