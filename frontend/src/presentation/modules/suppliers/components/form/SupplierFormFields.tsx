'use client';

import { useState } from 'react';
import type { CreateSupplierData } from '@/core/supplier/entities/supplier';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Textarea } from '@/presentation/shared/components/form/Textarea';
import { SupplierBasicInfo } from './SupplierBasicInfo';
import { SupplierContactFields } from './SupplierContactFields';
import { SupplierAddressFields } from './SupplierAddressFields';

interface SupplierFormFieldsProps {
  onSubmit: (data: CreateSupplierData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function SupplierFormFields({ onSubmit, isSubmitting, onCancel }: SupplierFormFieldsProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      code: code || undefined,
      contactName: contactName || undefined,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      notes: notes || undefined,
    });
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
          address={address}
          onAddressChange={setAddress}
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
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Crear Proveedor'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
