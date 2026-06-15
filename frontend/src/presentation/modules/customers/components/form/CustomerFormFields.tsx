'use client';

import { useState, useMemo, useCallback } from 'react';
import type { CreateCustomerData } from '@/core/customer/entities/customer';
import { EntityForm, type EntityFormField } from '@/presentation/shared/components/form/EntityForm';
import { GeoFields } from '@/presentation/shared/components/form/GeoFields';
import { createCustomerSchema, updateCustomerSchema } from '@/core/validators/customer-validators';

const FIELDS: EntityFormField[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Cliente S.A.' },
  { name: 'code', label: 'Código', type: 'text', required: false, placeholder: 'CLI-001', hint: 'Código', hintDescription: 'Código interno del cliente (CLI-001)' },
  { name: 'contactName', label: 'Contacto', type: 'text', required: false, placeholder: 'María López' },
  { name: 'phone', label: 'Teléfono', type: 'text', required: false, placeholder: '+53 5555 5555' },
  { name: 'email', label: 'Email', type: 'text', required: false, placeholder: 'cliente@empresa.com' },
  { name: 'address', label: 'Dirección', type: 'text', required: false, placeholder: 'Calle 10 #123' },
  { name: 'province', label: 'Provincia', type: 'text', required: false },
  { name: 'municipality', label: 'Municipio', type: 'text', required: false },
  { name: 'street', label: 'Calle', type: 'text', required: false },
  { name: 'locality', label: 'Localidad', type: 'text', required: false },
  { name: 'zipCode', label: 'CP', type: 'text', required: false },
  { name: 'latitude', label: 'Latitud', type: 'text', required: false },
  { name: 'longitude', label: 'Longitud', type: 'text', required: false },
  { name: 'notes', label: 'Notas', type: 'textarea', required: false, rows: 3, placeholder: 'Notas adicionales...', className: 'col-span-full' },
];

interface CustomerFormFieldsProps {
  onSubmit: (data: CreateCustomerData) => void;
  onContinue?: (data: CreateCustomerData) => void;
  onCancel: () => void;
  storageKey?: string;
}

export function CustomerFormFields({ onSubmit, onContinue, onCancel, storageKey = 'customer-create' }: CustomerFormFieldsProps) {
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
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notes, setNotes] = useState('');

  const values = useMemo<Record<string, string>>(() => ({
    name, code, contactName, phone, email, address,
    province, municipality, street, locality, zipCode,
    latitude, longitude, notes,
  }), [name, code, contactName, phone, email, address, province, municipality, street, locality, zipCode, latitude, longitude, notes]);

  const onChange = useCallback((field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      name: setName, code: setCode, contactName: setContactName,
      phone: setPhone, email: setEmail, address: setAddress,
      province: setProvince, municipality: setMunicipality,
      street: setStreet, locality: setLocality, zipCode: setZipCode,
      latitude: setLatitude, longitude: setLongitude, notes: setNotes,
    };
    setters[field]?.(value);
  }, []);

  const resetForm = useCallback(() => {
    setName(''); setCode(''); setContactName(''); setPhone(''); setEmail('');
    setAddress(''); setProvince(''); setMunicipality('');
    setStreet(''); setLocality(''); setZipCode('');
    setLatitude(''); setLongitude(''); setNotes('');
  }, []);

  const handleSubmitAction = useCallback(async (formValues: Record<string, string>) => {
    const data: CreateCustomerData = {
      name: formValues.name,
      code: formValues.code || undefined,
      contactName: formValues.contactName || undefined,
      phone: formValues.phone || undefined,
      email: formValues.email || undefined,
      address: formValues.address || undefined,
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
    const data: CreateCustomerData = {
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
    };
    onContinue?.(data);
    resetForm();
  }, [name, code, contactName, phone, email, address, province, municipality, street, locality, zipCode, latitude, longitude, notes, onContinue, resetForm]);

  return (
    <>
      <EntityForm
        title="Nuevo Cliente"
        description="Completa los datos del cliente"
        fields={FIELDS}
        values={values}
        onChange={onChange}
        onSubmitAction={handleSubmitAction}
        onCancel={onCancel}
        onContinue={onContinue ? handleContinue : undefined}
        createSchema={createCustomerSchema}
        updateSchema={updateCustomerSchema}
        storageKey={storageKey}
        persistCreateValues={false}
        submitLabel="Crear Cliente"
        submitLoadingLabel="Guardando..."
        renderField={({ field, onChange: onValueChange, defaultRender, allErrors }) => {
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
              />
            );
          }
          if (['municipality', 'street', 'locality', 'zipCode', 'latitude', 'longitude'].includes(field.name)) {
            return null;
          }
          return defaultRender(field);
        }}
      />
    </>
  );
}
