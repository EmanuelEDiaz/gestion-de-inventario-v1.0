'use client';

import Link from 'next/link';
import type { Customer } from '@/core/customer/entities/customer';
import { formatDateShort } from '@/presentation/shared/lib/utils';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { TableCell, TableRow } from '@/presentation/shared/components/ui/table';
import { statusBadge } from '@/presentation/shared/lib/colors';
import { CustomerActions } from './CustomerActions';

interface CustomerRowProps {
  customer: Customer;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function CustomerRow({ customer, onActivate, onDeactivate, onDelete }: CustomerRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link href={`/customers/${customer.id}`} className="hover:underline text-primary" title="Ver detalle del cliente">
          {customer.code || 'N/A'}
        </Link>
      </TableCell>
      <TableCell>{customer.name}</TableCell>
      <TableCell>{customer.phone || 'N/A'}</TableCell>
      <TableCell>{customer.email || 'N/A'}</TableCell>
      <TableCell>
        <Badge className={statusBadge(customer.active)}>
          {customer.active ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      <TableCell>{formatDateShort(customer.createdAt)}</TableCell>
      <TableCell className="text-right">
        <CustomerActions 
          id={customer.id} 
          active={customer.active}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
