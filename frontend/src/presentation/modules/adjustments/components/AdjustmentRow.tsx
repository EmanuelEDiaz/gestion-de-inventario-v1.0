'use client';

import type { Adjustment } from '@/core/entities/adjustment';
import { ADJUSTMENT_STATUS_LABELS, ADJUSTMENT_STATUS_COLORS, ADJUSTMENT_TYPE_LABELS } from '@/core/entities/adjustment';
import { formatDateShort } from '@/presentation/shared/lib/utils';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { TableCell, TableRow } from '@/presentation/shared/components/ui/table';
import { AdjustmentActions } from './AdjustmentActions';

interface AdjustmentRowProps {
  adjustment: Adjustment;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AdjustmentRow({ adjustment, onConfirm, onCancel, onDelete }: AdjustmentRowProps) {
  const { id, adjustmentNumber, warehouseName, type, status, adjustmentDate, lines } = adjustment;
  const totalDiff = lines.reduce((sum, l) => sum + l.difference, 0);
  const diffClass = totalDiff > 0 ? 'text-green-600' : totalDiff < 0 ? 'text-red-600' : '';

  return (
    <TableRow>
      <TableCell className="font-medium">{adjustmentNumber}</TableCell>
      <TableCell>{warehouseName || 'N/A'}</TableCell>
      <TableCell>{ADJUSTMENT_TYPE_LABELS[type]}</TableCell>
      <TableCell>
        <Badge className={ADJUSTMENT_STATUS_COLORS[status]}>
          {ADJUSTMENT_STATUS_LABELS[status]}
        </Badge>
      </TableCell>
      <TableCell>{formatDateShort(adjustmentDate)}</TableCell>
      <TableCell>{lines.length} producto(s)</TableCell>
      <TableCell className={diffClass}>{totalDiff > 0 ? '+' : ''}{totalDiff}</TableCell>
      <TableCell className="text-right">
        <AdjustmentActions 
          status={status} id={id} 
          onConfirm={onConfirm} onCancel={onCancel} onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
