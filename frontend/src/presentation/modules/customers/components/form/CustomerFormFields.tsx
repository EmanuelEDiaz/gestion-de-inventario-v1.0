'use client';

import { useState } from 'react';
import type { CreateCustomerData } from '@/core/customer/entities/customer';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Textarea } from '@/presentation/shared/components/form/Textarea';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import { useProvinces } from '@/presentation/modules/geo/hooks/useProvinces';
import { useMunicipalities } from '@/presentation/modules/geo/hooks/useMunicipalities';
import { MapPin } from '@/presentation/shared/components/ui/icon-mapping';
import { MapPickerModal } from '@/presentation/shared/components/map/MapPickerModal';

interface CustomerFormFieldsProps {
  onSubmit: (data: CreateCustomerData) => void;
  onContinue?: (data: CreateCustomerData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function CustomerFormFields({ onSubmit, onContinue, isSubmitting, onCancel }: CustomerFormFieldsProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [street, setStreet] = useState('');
  const [locality, setLocality] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [shouldContinue, setShouldContinue] = useState(false);

  const { data: provinces } = useProvinces();
  const { data: municipalities } = useMunicipalities(province || undefined);

  const resetForm = () => {
    setName('');
    setCode('');
    setContactName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setProvince('');
    setMunicipality('');
    setStreet('');
    setLocality('');
    setZipCode('');
    setLatitude('');
    setLongitude('');
    setNotes('');
  };

  const getData = (): CreateCustomerData => ({
    name,
    code: code || undefined,
    contactName: contactName || undefined,
    phone: phone || undefined,
    email: email || undefined,
    address: address || undefined,
    province: province || undefined,
    municipality: municipality || undefined,
    street: street || undefined,
    locality: locality || undefined,
    zipCode: zipCode || undefined,
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
    notes: notes || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = getData();
    if (shouldContinue && onContinue) {
      resetForm();
      onContinue(data);
    } else {
      onSubmit(data);
    }
    setShouldContinue(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">Nombre *</label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cliente S.A." required title="Nombre del cliente" />
        </div>
        <div className="space-y-1">
          <label htmlFor="code" className="text-sm font-medium">
            <span className="inline-flex items-center gap-1">Código<TooltipHint title="Código" description="Código interno del cliente (CLI-001)" /></span>
          </label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CLI-001" title="Código de referencia" />
        </div>
        <div className="space-y-1">
          <label htmlFor="contactName" className="text-sm font-medium">Contacto</label>
          <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="María López" title="Persona de contacto" />
        </div>
        <div className="space-y-1">
          <label htmlFor="phone" className="text-sm font-medium">Teléfono</label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+53 5555 5555" title="Número de teléfono" />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@empresa.com" title="Correo electrónico" />
        </div>
        <div className="space-y-1">
          <label htmlFor="address" className="text-sm font-medium">Dirección</label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle 10 #123" title="Dirección del cliente" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium">
            <span className="inline-flex items-center gap-1">Dirección estructurada <TooltipHint title="Dirección estructurada" description="Provincia, municipio, calle y código postal" /></span>
          </label>
        </div>
        <div className="space-y-1">
          <label htmlFor="customer-province" className="text-sm font-medium">Provincia</label>
          <select id="customer-province" value={province} onChange={(e) => setProvince(e.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
            <option value="">Seleccionar provincia</option>
            {provinces?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="customer-municipality" className="text-sm font-medium">Municipio</label>
          <select id="customer-municipality" value={municipality} onChange={(e) => setMunicipality(e.target.value)}
            disabled={!province}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50">
            <option value="">Seleccionar municipio</option>
            {municipalities?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Input id="customer-street" value={street} onChange={(e) => setStreet(e.target.value)}
            placeholder="Calle #123" title="Calle y número" />
        </div>
        <div className="space-y-1">
          <Input id="customer-locality" value={locality} onChange={(e) => setLocality(e.target.value)}
            placeholder="Reparto/Comunidad" title="Reparto o comunidad" />
        </div>
        <div className="space-y-1">
          <Input id="customer-zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)}
            placeholder="Código Postal" title="Código postal" />
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
      </div>
      <MapPickerModal
        open={showMapPicker}
        province={province}
        municipality={municipality}
        initialLocation={latitude && longitude ? { lat: parseFloat(latitude), lng: parseFloat(longitude) } : undefined}
        onSelect={(lat, lng) => {
          setLatitude(lat.toString());
          setLongitude(lng.toString());
          setShowMapPicker(false);
        }}
        onClose={() => setShowMapPicker(false)}
      />
      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notas</label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." rows={3} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Crear Cliente'}</Button>
        {onContinue && (
          <Button type="submit" variant="outline" disabled={isSubmitting}
            onClick={() => setShouldContinue(true)}>
            {isSubmitting ? 'Guardando...' : 'Crear y Continuar'}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
