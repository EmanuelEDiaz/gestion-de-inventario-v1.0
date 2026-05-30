'use client';

import { Input } from '@/presentation/shared/components/ui/Input';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';

interface SupplierContactFieldsProps {
  contactName: string;
  code: string;
  onContactNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
}

export function SupplierContactFields({ contactName, code, onContactNameChange, onCodeChange }: SupplierContactFieldsProps) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="contactName" className="text-sm font-medium">Contacto</label>
        <Input id="contactName" value={contactName} onChange={(e) => onContactNameChange(e.target.value)} placeholder="Juan Pérez" title="Persona de contacto" />
      </div>
      <div className="space-y-1">
        <label htmlFor="code" className="text-sm font-medium">
          <span className="inline-flex items-center gap-1">Código<TooltipHint title="Código" description="Código interno del proveedor (PROV-001)" /></span>
        </label>
        <Input id="code" value={code} onChange={(e) => onCodeChange(e.target.value)} placeholder="PROV-001" title="Código de referencia del proveedor" />
      </div>
    </>
  );
}
