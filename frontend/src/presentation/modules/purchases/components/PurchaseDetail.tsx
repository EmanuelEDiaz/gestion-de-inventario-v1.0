'use client';

import { type Purchase } from '@/core/purchase/entities/purchase';
import { PurchaseDetailHeader } from './PurchaseDetailHeader';
import { PurchaseDetailInfo } from './PurchaseDetailInfo';
import { PurchaseDetailNotes } from './PurchaseDetailNotes';
import { PurchaseDetailLines } from './PurchaseDetailLines';
import { PurchaseDetailActions } from './PurchaseDetailActions';

interface PurchaseDetailProps {
  purchase: Purchase;
  onConfirm?: () => void;
  onReceive?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function PurchaseDetail({
  purchase,
  onConfirm,
  onReceive,
  onCancel,
  onClose
}: PurchaseDetailProps) {
  return (
    <div className="bg-card border rounded-lg p-6">
      <PurchaseDetailHeader purchase={purchase} onClose={onClose} />
      <PurchaseDetailInfo purchase={purchase} />
      <PurchaseDetailNotes notes={purchase.notes} />
      <PurchaseDetailLines purchase={purchase} />
      <PurchaseDetailActions
        purchase={purchase}
        onConfirm={onConfirm}
        onReceive={onReceive}
        onCancel={onCancel}
      />
    </div>
  );
}
