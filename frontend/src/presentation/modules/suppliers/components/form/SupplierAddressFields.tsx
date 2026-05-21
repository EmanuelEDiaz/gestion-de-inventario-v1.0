'use client';

import { Input } from '@/presentation/shared/components/ui/Input';

interface SupplierAddressFieldsProps {
  address: string;
  onAddressChange: (value: string) => void;
}

export function SupplierAddressFields({ address, onAddressChange }: SupplierAddressFieldsProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="address" className="text-sm font-medium">Dirección</label>
      <Input id="address" value={address} onChange={(e) => onAddressChange(e.target.value)} placeholder="Calle 23 #456" title="Dirección del proveedor" />
    </div>
  );
}
