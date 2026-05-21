'use client';

import { Input } from '@/presentation/shared/components/ui/Input';

interface SupplierBasicInfoProps {
  name: string;
  email: string;
  phone: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function SupplierBasicInfo({ name, email, phone, onNameChange, onEmailChange, onPhoneChange }: SupplierBasicInfoProps) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">Nombre *</label>
        <Input id="name" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Proveedor S.A." required title="Nombre del proveedor" />
      </div>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input id="email" type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} placeholder="proveedor@empresa.com" title="Correo electrónico" />
      </div>
      <div className="space-y-1">
        <label htmlFor="phone" className="text-sm font-medium">Teléfono</label>
        <Input id="phone" value={phone} onChange={(e) => onPhoneChange(e.target.value)} placeholder="+53 5555 5555" title="Número de teléfono" />
      </div>
    </>
  );
}
