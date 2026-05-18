'use client';

import { useState } from 'react';
import type { CreatePurchaseInput } from '@/core/entities/purchase';
import { useReferenceData } from '@/presentation/shared/hooks/useReferenceData';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Plus } from 'lucide-react';
import { PurchaseSupplierSelector } from './PurchaseSupplierSelector';
import { PurchaseItemRow, type PurchaseLineInput } from './PurchaseItemRow';
import { PurchaseSummary } from './PurchaseSummary';

interface PurchaseFormFieldsProps {
  onSubmit: (data: CreatePurchaseInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const emptyLine = (): PurchaseLineInput => ({ productId: '', quantity: '1', unitCost: '' });

export function PurchaseFormFields({ onSubmit, isSubmitting, onCancel }: PurchaseFormFieldsProps) {
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PurchaseLineInput[]>([emptyLine()]);

  const { warehouses, products, suppliers } = useReferenceData({ withSuppliers: true });

  const updateLine = (i: number, field: keyof PurchaseLineInput, value: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => { if (lines.length > 1) setLines((prev) => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      warehouseId,
      supplierId: supplierId || undefined,
      notes: notes || undefined,
      lines: lines.filter((l) => l.productId && l.unitCost).map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PurchaseSupplierSelector
        warehouses={warehouses}
        suppliers={suppliers}
        warehouseId={warehouseId}
        supplierId={supplierId}
        onWarehouseChange={setWarehouseId}
        onSupplierChange={setSupplierId}
      />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Líneas de Compra</h3>
          <Button type="button" size="sm" variant="outline" onClick={addLine} title="Agregar línea"><Plus className="h-4 w-4 mr-1" /> Línea</Button>
        </div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <PurchaseItemRow
              key={i}
              line={line}
              index={i}
              products={products}
              onUpdate={updateLine}
              onRemove={removeLine}
              isOnlyLine={lines.length === 1}
            />
          ))}
        </div>
      </div>
      <PurchaseSummary
        notes={notes}
        onNotesChange={setNotes}
        isSubmitting={isSubmitting}
        onCancel={onCancel}
      />
    </form>
  );
}
