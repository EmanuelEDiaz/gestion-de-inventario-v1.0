'use client';

import { useState } from 'react';
import type { CreateSupplierData } from '@/core/supplier/entities/supplier';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Textarea } from '@/presentation/shared/components/form/Textarea';
import { SupplierBasicInfo } from './SupplierBasicInfo';
import { SupplierContactFields } from './SupplierContactFields';
import { SupplierAddressFields } from './SupplierAddressFields';
import { useProvinces } from '@/presentation/modules/geo/hooks/useProvinces';
import { useMunicipalities } from '@/presentation/modules/geo/hooks/useMunicipalities';
import { MapPickerModal } from '@/presentation/shared/components/map/MapPickerModal';

interface SupplierFormFieldsProps {
  onSubmit: (data: CreateSupplierData) => void;
  onContinue?: (data: CreateSupplierData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function SupplierFormFields({ onSubmit, onContinue, isSubmitting, onCancel }: SupplierFormFieldsProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [street, setStreet] = useState('');
  const [locality, setLocality] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [shouldContinue, setShouldContinue] = useState(false);

  const { data: provinces } = useProvinces();
  const { data: municipalities } = useMunicipalities(province || undefined);

  const resetForm = () => {
    setName('');
    setCode('');
    setContactName('');
    setPhone('');
    setEmail('');
    setProvince('');
    setMunicipality('');
    setStreet('');
    setLocality('');
    setZipCode('');
    setLatitude('');
    setLongitude('');
    setNotes('');
  };

  const getData = (): CreateSupplierData => ({
    name,
    code: code || undefined,
    contactName: contactName || undefined,
    phone: phone || undefined,
    email: email || undefined,
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
        <SupplierBasicInfo
          name={name}
          email={email}
          phone={phone}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPhoneChange={setPhone}
        />
        <SupplierContactFields
          contactName={contactName}
          code={code}
          onContactNameChange={setContactName}
          onCodeChange={setCode}
        />
        <SupplierAddressFields
          province={province}
          municipality={municipality}
          street={street}
          locality={locality}
          zipCode={zipCode}
          latitude={latitude}
          longitude={longitude}
          provinces={provinces}
          municipalities={municipalities}
          onProvinceChange={setProvince}
          onMunicipalityChange={setMunicipality}
          onStreetChange={setStreet}
          onLocalityChange={setLocality}
          onZipCodeChange={setZipCode}
          onLatitudeChange={setLatitude}
          onLongitudeChange={setLongitude}
          onOpenMapPicker={() => setShowMapPicker(true)}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notas</label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionales..."
          rows={3}
        />
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
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Crear Proveedor'}
        </Button>
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
