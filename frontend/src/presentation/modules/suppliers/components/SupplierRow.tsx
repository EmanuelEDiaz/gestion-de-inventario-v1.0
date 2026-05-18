'use client';

import Link from 'next/link';
import type { Supplier } from '@/core/entities/supplier';
import { formatDateShort } from '@/presentation/shared/lib/utils';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { TableCell, TableRow } from '@/presentation/shared/components/ui/table';
import { statusBadge } from '@/presentation/shared/lib/colors';
import { SupplierActions } from './SupplierActions';

interface SupplierRowProps {
  supplier: Supplier;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SupplierRow({ supplier, onActivate, onDeactivate, onDelete }: SupplierRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link
          href={`/suppliers/${supplier.id}`}
          className="text-primary hover:underline"
          title={`Ver detalle de ${supplier.name}`}
        >
          {supplier.code || 'N/A'}
        </Link>
      </TableCell>
      <TableCell>{supplier.name}</TableCell>
      <TableCell>{supplier.phone || 'N/A'}</TableCell>
      <TableCell>{supplier.email || 'N/A'}</TableCell>
      <TableCell>
        <Badge className={statusBadge(supplier.active)}>
          {supplier.active ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      <TableCell>{formatDateShort(supplier.createdAt)}</TableCell>
      <TableCell className="text-right">
        <SupplierActions 
          id={supplier.id} 
          active={supplier.active}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
