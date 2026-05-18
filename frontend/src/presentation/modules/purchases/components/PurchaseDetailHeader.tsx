'use client';

import { type Purchase, getPurchaseStatusLabel, getPurchaseStatusColor } from '@/core/entities/purchase';
import { formatDateShort } from '@/presentation/shared/lib/utils';

interface PurchaseDetailHeaderProps {
  purchase: Purchase;
  onClose?: () => void;
}

export function PurchaseDetailHeader({ purchase, onClose }: PurchaseDetailHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h2 className="text-xl font-bold">{purchase.purchaseNumber}</h2>
        <p className="text-sm text-muted-foreground">
          Fecha: {formatDateShort(purchase.purchaseDate)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPurchaseStatusColor(purchase.status)}`}>
          {getPurchaseStatusLabel(purchase.status)}
        </span>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-muted rounded">✕</button>
        )}
      </div>
    </div>
  );
}
