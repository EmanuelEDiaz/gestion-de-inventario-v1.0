'use client';

import type { Adjustment } from '@/core/entities/adjustment';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/shared/components/ui/table';
import { AdjustmentRow } from './AdjustmentRow';

interface AdjustmentTableProps {
  adjustments: Adjustment[];
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AdjustmentTable({ adjustments, onConfirm, onCancel, onDelete }: AdjustmentTableProps) {
  if (adjustments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay ajustes registrados
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Almacén</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Productos</TableHead>
          <TableHead>Diferencia</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adjustments.map(adjustment => (
          <AdjustmentRow 
            key={adjustment.id} 
            adjustment={adjustment}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
