'use client';

import type { Customer } from '@/core/entities/customer';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/shared/components/ui/table';
import { CustomerRow } from './CustomerRow';

interface CustomerTableProps {
  customers: Customer[];
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function CustomerTable({ customers, onActivate, onDeactivate, onDelete }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay clientes registrados
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Creado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map(customer => (
          <CustomerRow 
            key={customer.id} 
            customer={customer}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
