'use client';

import { useState } from 'react';
import type { CreateCustomerData } from '@/core/customer/entities/customer';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Textarea } from '@/presentation/shared/components/form/Textarea';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';

interface CustomerFormFieldsProps {
  onSubmit: (data: CreateCustomerData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function CustomerFormFields({ onSubmit, isSubmitting, onCancel }: CustomerFormFieldsProps) {
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
      </div>
      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notas</label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." rows={3} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Crear Cliente'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
