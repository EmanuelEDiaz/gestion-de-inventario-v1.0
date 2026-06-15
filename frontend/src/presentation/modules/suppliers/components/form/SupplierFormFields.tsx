'use client';

import { useState, useMemo, useCallback } from 'react';
import type { CreateSupplierData } from '@/core/supplier/entities/supplier';
import { EntityForm, type EntityFormField } from '@/presentation/shared/components/form/EntityForm';
import { GeoFields } from '@/presentation/shared/components/form/GeoFields';
import { SupplierBasicInfo } from './SupplierBasicInfo';
import { SupplierContactFields } from './SupplierContactFields';
import { MapPickerModal } from '@/presentation/shared/components/map/MapPickerModal';
import { createSupplierSchema, updateSupplierSchema } from '@/core/validators/supplier-validators';

const FIELDS: EntityFormField[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Proveedor S.A.' },
  { name: 'email', label: 'Email', type: 'text', required: false, placeholder: 'proveedor@empresa.com' },
  { name: 'phone', label: 'Teléfono', type: 'text', required: false, placeholder: '+53 5555 5555' },
  { name: 'contactName', label: 'Contacto', type: 'text', required: false, placeholder: 'Juan Pérez' },
  { name: 'code', label: 'Código', type: 'text', required: false, placeholder: 'PROV-001', hint: 'Código', hintDescription: 'Código interno del proveedor (PROV-001)' },
  { name: 'province', label: 'Provincia', type: 'text', required: false },
  { name: 'municipality', label: 'Municipio', type: 'text', required: false },
  { name: 'street', label: 'Calle', type: 'text', required: false },
  { name: 'locality', label: 'Localidad', type: 'text', required: false },
  { name: 'zipCode', label: 'CP', type: 'text', required: false },
  { name: 'latitude', label: 'Latitud', type: 'text', required: false },
  { name: 'longitude', label: 'Longitud', type: 'text', required: false },
  { name: 'notes', label: 'Notas', type: 'textarea', required: false, rows: 3, placeholder: 'Notas adicionales...', className: 'col-span-full' },
];

interface SupplierFormFieldsProps {
  onSubmit: (data: CreateSupplierData) => void;
  onContinue?: (data: CreateSupplierData) => void;
  onCancel: () => void;
  storageKey?: string;
}

export function SupplierFormFields({ onSubmit, onContinue, onCancel, storageKey = 'supplier-create' }: SupplierFormFieldsProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [code, setCode] = useState('');
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [street, setStreet] = useState('');
  const [locality, setLocality] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notes, setNotes] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);

  const values = useMemo<Record<string, string>>(() => ({
    name, email, phone, contactName, code,
    province, municipality, street, locality, zipCode,
    latitude, longitude, notes,
  }), [name, email, phone, contactName, code, province, municipality, street, locality, zipCode, latitude, longitude, notes]);

  const onChange = useCallback((field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      name: setName, email: setEmail, phone: setPhone,
      contactName: setContactName, code: setCode,
      province: setProvince, municipality: setMunicipality,
      street: setStreet, locality: setLocality, zipCode: setZipCode,
      latitude: setLatitude, longitude: setLongitude, notes: setNotes,
    };
    setters[field]?.(value);
  }, []);

  const resetForm = useCallback(() => {
    setName(''); setEmail(''); setPhone(''); setContactName(''); setCode('');
    setProvince(''); setMunicipality('');
    setStreet(''); setLocality(''); setZipCode('');
    setLatitude(''); setLongitude(''); setNotes('');
  }, []);

  const handleSubmitAction = useCallback(async (formValues: Record<string, string>) => {
    const data: CreateSupplierData = {
      name: formValues.name,
      code: formValues.code || undefined,
      contactName: formValues.contactName || undefined,
      phone: formValues.phone || undefined,
      email: formValues.email || undefined,
      province: formValues.province || undefined,
      municipality: formValues.municipality || undefined,
      street: formValues.street || undefined,
      locality: formValues.locality || undefined,
      zipCode: formValues.zipCode || undefined,
      latitude: formValues.latitude ? parseFloat(formValues.latitude) : undefined,
      longitude: formValues.longitude ? parseFloat(formValues.longitude) : undefined,
      notes: formValues.notes || undefined,
    };
    await onSubmit(data);
  }, [onSubmit]);

  const handleContinue = useCallback(() => {
    const data: CreateSupplierData = {
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
    };
    onContinue?.(data);
    resetForm();
  }, [name, code, contactName, phone, email, province, municipality, street, locality, zipCode, latitude, longitude, notes, onContinue, resetForm]);

  return (
    <>
      <EntityForm
        title="Nuevo Proveedor"
        description="Completa los datos del proveedor"
        fields={FIELDS}
        values={values}
        onChange={onChange}
        onSubmitAction={handleSubmitAction}
        onCancel={onCancel}
        onContinue={onContinue ? handleContinue : undefined}
        createSchema={createSupplierSchema}
        updateSchema={updateSupplierSchema}
        storageKey={storageKey}
        persistCreateValues={false}
        submitLabel="Crear Proveedor"
        submitLoadingLabel="Guardando..."
        renderField={({ field, onChange: onValueChange, defaultRender, allErrors }) => {
          if (field.name === 'name') {
            return (
              <SupplierBasicInfo
                name={values.name}
                email={values.email}
                phone={values.phone}
                onNameChange={(v) => onValueChange('name', v)}
                onEmailChange={(v) => onValueChange('email', v)}
                onPhoneChange={(v) => onValueChange('phone', v)}
              />
            );
          }
          if (field.name === 'contactName') {
            return (
              <SupplierContactFields
                contactName={values.contactName}
                code={values.code}
                onContactNameChange={(v) => onValueChange('contactName', v)}
                onCodeChange={(v) => onValueChange('code', v)}
              />
            );
          }
          if (field.name === 'province') {
            return (
              <GeoFields
                province={values.province}
                municipality={values.municipality}
                street={values.street}
                locality={values.locality}
                zipCode={values.zipCode}
                latitude={values.latitude}
                longitude={values.longitude}
                onChange={onValueChange}
                errors={allErrors}
                onOpenMapPicker={() => setShowMapPicker(true)}
              />
            );
          }
          if (['email', 'phone', 'code', 'municipality', 'street', 'locality', 'zipCode', 'latitude', 'longitude'].includes(field.name)) {
            return null;
          }
          return defaultRender(field);
        }}
      />
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
