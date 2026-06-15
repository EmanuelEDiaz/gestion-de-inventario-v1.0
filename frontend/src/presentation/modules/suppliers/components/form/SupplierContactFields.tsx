'use client';

import { Input } from '@/presentation/shared/components/ui/Input';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';

interface SupplierContactFieldsProps {
  contactName: string;
  code: string;
  onContactNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  contactNameError?: string;
  codeError?: string;
}

export function SupplierContactFields({ contactName, code, onContactNameChange, onCodeChange, contactNameError, codeError }: SupplierContactFieldsProps) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="contactName" className="text-sm font-medium">Contacto</label>
        <Input id="contactName" value={contactName} onChange={(e) => onContactNameChange(e.target.value)} placeholder="Juan Pérez" title="Persona de contacto" />
        {contactNameError && <p className="text-xs text-red-500">{contactNameError}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor="code" className="text-sm font-medium">
          <span className="inline-flex items-center gap-1">Código<TooltipHint title="Código" description="Código interno del proveedor (PROV-001)" /></span>
        </label>
        <Input id="code" value={code} onChange={(e) => onCodeChange(e.target.value)} placeholder="PROV-001" title="Código de referencia del proveedor" />
        {codeError && <p className="text-xs text-red-500">{codeError}</p>}
      </div>
    </>
  );
}
