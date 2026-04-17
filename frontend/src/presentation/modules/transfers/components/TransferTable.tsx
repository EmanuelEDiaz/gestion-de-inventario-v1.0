'use client';

import type { Transfer } from '@/core/entities/transfer';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/shared/components/ui/table';
import { TransferRow } from './TransferRow';

interface TransferTableProps {
  transfers: Transfer[];
  onConfirm?: (id: string) => void;
  onShip?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TransferTable({ 
  transfers, onConfirm, onShip, onComplete, onCancel, onDelete 
}: TransferTableProps) {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay transferencias registradas
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Origen → Destino</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Productos</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transfers.map(transfer => (
          <TransferRow 
            key={transfer.id} 
            transfer={transfer}
            onConfirm={onConfirm}
            onShip={onShip}
            onComplete={onComplete}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
