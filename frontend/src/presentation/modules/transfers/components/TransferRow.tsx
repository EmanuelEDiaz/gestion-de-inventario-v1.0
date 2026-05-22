'use client';

import type { Transfer } from '@/core/transfer/entities/transfer';
import { TRANSFER_STATUS_LABELS, TRANSFER_STATUS_COLORS } from '@/core/transfer/entities/transfer';
import { formatDateShort } from '@/presentation/shared/lib/utils';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { TableCell, TableRow } from '@/presentation/shared/components/ui/table';
import { ArrowRight } from '@/presentation/shared/components/ui/icon-mapping';
import { TransferActions } from './TransferActions';

interface TransferRowProps {
  transfer: Transfer;
  onConfirm?: (id: string) => void;
  onShip?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TransferRow({ 
  transfer, onConfirm, onShip, onComplete, onCancel, onDelete 
}: TransferRowProps) {
  const { id, transferNumber, fromWarehouseName, toWarehouseName, status, transferDate, lines } = transfer;

  return (
    <TableRow>
      <TableCell className="font-medium">{transferNumber}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{fromWarehouseName || 'N/A'}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span>{toWarehouseName || 'N/A'}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={TRANSFER_STATUS_COLORS[status]}>
          {TRANSFER_STATUS_LABELS[status]}
        </Badge>
      </TableCell>
      <TableCell>{formatDateShort(transferDate)}</TableCell>
      <TableCell>{lines.length} producto(s)</TableCell>
      <TableCell className="text-right">
        <TransferActions 
          status={status} id={id}
          onConfirm={onConfirm} onShip={onShip} 
          onComplete={onComplete} onCancel={onCancel} onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
