'use client';

import { useState } from 'react';
import type { CreateTransferRequest } from '@/core/transfer/entities/transfer';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import type { Product } from '@/core/product/entities/product';
import { useReferenceData } from '@/presentation/shared/hooks/api/useReferenceData';
import { Button, TooltipWrapper } from '@/presentation/shared/components/ui';
import { Textarea } from '@/presentation/shared/components/form/Textarea';
import { TransferOriginFields } from './TransferOriginFields';
import { TransferDestinationFields } from './TransferDestinationFields';
import { TransferProductList } from './TransferProductList';

interface TransferLineInput {
  productId: string;
  quantity: string;
}

interface TransferFormFieldsProps {
  onSubmit: (data: CreateTransferRequest) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const emptyLine = (): TransferLineInput => ({ productId: '', quantity: '1' });

export function TransferFormFields({ onSubmit, isSubmitting, onCancel }: TransferFormFieldsProps) {
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<TransferLineInput[]>([emptyLine()]);

  const { warehouses, products } = useReferenceData();

  const updateLine = (i: number, field: keyof TransferLineInput, value: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => { if (lines.length > 1) setLines((prev) => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      fromWarehouseId,
      toWarehouseId,
      notes: notes || undefined,
      lines: lines.filter((l) => l.productId).map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TransferOriginFields warehouses={warehouses} value={fromWarehouseId} onChange={setFromWarehouseId} />
        <TransferDestinationFields warehouses={warehouses} fromWarehouseId={fromWarehouseId} value={toWarehouseId} onChange={setToWarehouseId} />
      </div>
      <TransferProductList products={products} lines={lines} onUpdateLine={updateLine} onAddLine={addLine} onRemoveLine={removeLine} />
      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notas</label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} />
      </div>
      <div className="flex gap-2">
        <TooltipWrapper content="Crear nueva transferencia de inventario">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Transferencia'}</Button>
        </TooltipWrapper>
        <TooltipWrapper content="Cancelar y volver">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </TooltipWrapper>
      </div>
    </form>
  );
}
