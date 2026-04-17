'use client';

import type { Supplier } from '@/core/entities/supplier';
import { formatDateShort } from '@/presentation/shared/lib/utils';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { TableCell, TableRow } from '@/presentation/shared/components/ui/table';
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
      <TableCell className="font-medium">{supplier.code || 'N/A'}</TableCell>
      <TableCell>{supplier.name}</TableCell>
      <TableCell>{supplier.phone || 'N/A'}</TableCell>
      <TableCell>{supplier.email || 'N/A'}</TableCell>
      <TableCell>
        <Badge className={supplier.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
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
