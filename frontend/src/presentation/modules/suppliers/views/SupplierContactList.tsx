'use client';

import { formatDateShort } from '@/presentation/shared/lib/utils';

interface SupplierContactListProps {
  supplier: {
    code?: string | null;
    contactName?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    address?: string | null;
    createdAt: string;
    notes?: string | null;
  };
}

export function SupplierContactList({ supplier }: SupplierContactListProps) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div><dt className="text-gray-500">Código</dt><dd className="font-medium">{supplier.code || 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Contacto</dt><dd>{supplier.contactName || 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Teléfono</dt><dd>{supplier.phone || 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Email</dt><dd>{supplier.email || 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Sitio web</dt><dd>{supplier.website || 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Dirección</dt><dd>{supplier.address || 'N/A'}</dd></div>
      <div><dt className="text-gray-500">Registrado</dt><dd>{formatDateShort(supplier.createdAt)}</dd></div>
      {supplier.notes && (
        <div className="col-span-2">
          <dt className="text-gray-500">Notas</dt>
          <dd className="mt-0.5">{supplier.notes}</dd>
        </div>
      )}
    </dl>
  );
}
