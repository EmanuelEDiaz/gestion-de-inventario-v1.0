'use client';

import type { Return } from '@/core/entities/return';
import { RETURN_STATUS_LABELS, RETURN_STATUS_COLORS, RETURN_TYPE_LABELS } from '@/core/entities/return';
import { formatDateShort, formatCurrency } from '@/presentation/shared/lib/utils';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { TableCell, TableRow } from '@/presentation/shared/components/ui/table';
import { ReturnActions } from './ReturnActions';

interface ReturnRowProps {
  returnItem: Return;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ReturnRow({ returnItem, onConfirm, onCancel, onDelete }: ReturnRowProps) {
  const { id, returnNumber, type, warehouseName, status, returnDate, totalAmount, lines } = returnItem;

  return (
    <TableRow>
      <TableCell className="font-medium">{returnNumber}</TableCell>
      <TableCell>{RETURN_TYPE_LABELS[type]}</TableCell>
      <TableCell>{warehouseName || 'N/A'}</TableCell>
      <TableCell>
        <Badge className={RETURN_STATUS_COLORS[status]}>
          {RETURN_STATUS_LABELS[status]}
        </Badge>
      </TableCell>
      <TableCell>{formatDateShort(returnDate)}</TableCell>
      <TableCell>{lines.length} producto(s)</TableCell>
      <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
      <TableCell className="text-right">
        <ReturnActions 
          status={status} id={id} 
          onConfirm={onConfirm} onCancel={onCancel} onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
