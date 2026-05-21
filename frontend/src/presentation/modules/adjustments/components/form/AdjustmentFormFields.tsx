'use client';

import { useState, useEffect } from 'react';
import type { AdjustmentType, CreateAdjustmentData } from '@/core/adjustment/entities/adjustment';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import type { Product } from '@/core/product/entities/product';
import { GetWarehousesUseCase } from '@/core/warehouse/use-cases/GetWarehousesUseCase';
import { GetProductsUseCase } from '@/core/product/use-cases/GetProductsUseCase';
import { WarehouseRepository } from '@/infrastructure/repositories/warehouse/WarehouseRepository';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { AdjustmentHeaderFields } from './AdjustmentHeaderFields';
import { AdjustmentReasonField } from './AdjustmentReasonField';
import { AdjustmentLinesSection } from './AdjustmentLinesSection';
import { AdjustmentNotesField } from './AdjustmentNotesField';
import { AdjustmentFormActions } from './AdjustmentFormActions';

interface AdjustmentLineInput {
  productId: string;
  systemQty: string;
  countedQty: string;
}

interface AdjustmentFormFieldsProps {
  onSubmit: (data: CreateAdjustmentData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const emptyLine = (): AdjustmentLineInput => ({ productId: '', systemQty: '0', countedQty: '0' });

export function AdjustmentFormFields({ onSubmit, isSubmitting, onCancel }: AdjustmentFormFieldsProps) {
  const [warehouseId, setWarehouseId] = useState('');
  const [type, setType] = useState<AdjustmentType>('COUNT');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<AdjustmentLineInput[]>([emptyLine()]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    new GetWarehousesUseCase(new WarehouseRepository()).execute().then(setWarehouses).catch(() => {});
    new GetProductsUseCase(new ProductRepository()).execute({ size: 200 }).then((r) => setProducts(r?.content ?? [])).catch(() => {});
  }, []);

  const updateLine = (i: number, field: keyof AdjustmentLineInput, value: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => { if (lines.length > 1) setLines((prev) => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      warehouseId,
      type,
      reason: reason || undefined,
      notes: notes || undefined,
      lines: lines.filter((l) => l.productId).map((l) => ({
        productId: l.productId,
        systemQty: Number(l.systemQty),
        countedQty: Number(l.countedQty),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AdjustmentHeaderFields
        warehouses={warehouses}
        warehouseId={warehouseId}
        onWarehouseChange={setWarehouseId}
        type={type}
        onTypeChange={(val) => setType(val as AdjustmentType)}
      />

      <AdjustmentReasonField value={reason} onChange={setReason} />

      <AdjustmentLinesSection
        lines={lines}
        products={products}
        onAddLine={addLine}
        onUpdate={updateLine}
        onRemove={removeLine}
      />

      <AdjustmentNotesField value={notes} onChange={setNotes} />

      <AdjustmentFormActions isSubmitting={isSubmitting} onCancel={onCancel} />
    </form>
  );
}
