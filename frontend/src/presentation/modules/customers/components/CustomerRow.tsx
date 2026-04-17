'use client';

import type { Customer } from '@/core/entities/customer';
import { formatDateShort } from '@/presentation/shared/lib/utils';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { TableCell, TableRow } from '@/presentation/shared/components/ui/table';
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
      <TableCell className="font-medium">{customer.code || 'N/A'}</TableCell>
      <TableCell>{customer.name}</TableCell>
      <TableCell>{customer.phone || 'N/A'}</TableCell>
      <TableCell>{customer.email || 'N/A'}</TableCell>
      <TableCell>
        <Badge className={customer.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
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
