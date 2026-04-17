'use client';

import type { Supplier } from '@/core/entities/supplier';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/shared/components/ui/table';
import { SupplierRow } from './SupplierRow';

interface SupplierTableProps {
  suppliers: Supplier[];
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SupplierTable({ suppliers, onActivate, onDeactivate, onDelete }: SupplierTableProps) {
  if (suppliers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay proveedores registrados
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
        {suppliers.map(supplier => (
          <SupplierRow 
            key={supplier.id} 
            supplier={supplier}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
