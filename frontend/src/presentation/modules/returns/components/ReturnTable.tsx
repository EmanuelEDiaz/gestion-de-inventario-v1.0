'use client';

import type { Return } from '@/core/entities/return';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/shared/components/ui/table';
import { ReturnRow } from './ReturnRow';

interface ReturnTableProps {
  returns: Return[];
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ReturnTable({ returns, onConfirm, onCancel, onDelete }: ReturnTableProps) {
  if (returns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay devoluciones registradas
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Almacén</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Productos</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {returns.map(returnItem => (
          <ReturnRow 
            key={returnItem.id} 
            returnItem={returnItem}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
