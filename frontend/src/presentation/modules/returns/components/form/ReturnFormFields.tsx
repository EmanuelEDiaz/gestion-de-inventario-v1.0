'use client';

import { useState, useEffect } from 'react';
import type { ReturnType as ReturnDocType, CreateReturnData } from '@/core/return/entities/return';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import type { Product } from '@/core/product/entities/product';
import { GetWarehousesUseCase } from '@/core/warehouse/use-cases/GetWarehousesUseCase';
import { GetProductsUseCase } from '@/core/product/use-cases/GetProductsUseCase';
import { WarehouseRepository } from '@/infrastructure/repositories/warehouse/WarehouseRepository';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { ReturnFormBasicFields } from './ReturnFormBasicFields';
import { ReturnFormItems } from './ReturnFormItems';
import { ReturnFormActions } from './ReturnFormActions';

interface ReturnLineInput {
  productId: string;
  quantity: string;
  unitPrice: string;
}

interface ReturnFormFieldsProps {
  onSubmit: (data: CreateReturnData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const emptyLine = (): ReturnLineInput => ({ productId: '', quantity: '1', unitPrice: '' });

export function ReturnFormFields({ onSubmit, isSubmitting, onCancel }: ReturnFormFieldsProps) {
  const [type, setType] = useState<ReturnDocType>('SALE_RETURN');
  const [warehouseId, setWarehouseId] = useState('');
  const [originalDocumentId, setOriginalDocumentId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<ReturnLineInput[]>([emptyLine()]);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    new GetWarehousesUseCase(new WarehouseRepository()).execute().then(setWarehouses).catch(() => {});
    new GetProductsUseCase(new ProductRepository()).execute({ size: 200 }).then((r) => setProducts(r?.content ?? [])).catch(() => {});
  }, []);

  const updateLine = (i: number, field: keyof ReturnLineInput, value: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => { if (lines.length > 1) setLines((prev) => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      warehouseId,
      originalDocumentId: originalDocumentId || undefined,
      reason: reason || undefined,
      notes: notes || undefined,
      lines: lines.filter((l) => l.productId && l.unitPrice).map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ReturnFormBasicFields
        type={type}
        warehouseId={warehouseId}
        originalDocumentId={originalDocumentId}
        reason={reason}
        warehouses={warehouses}
        onTypeChange={setType}
        onWarehouseChange={setWarehouseId}
        onOriginalDocumentChange={setOriginalDocumentId}
        onReasonChange={setReason}
      />
      <ReturnFormItems
        lines={lines}
        products={products}
        onUpdateLine={updateLine}
        onAddLine={addLine}
        onRemoveLine={removeLine}
      />
      <ReturnFormActions
        notes={notes}
        isSubmitting={isSubmitting}
        onNotesChange={setNotes}
        onCancel={onCancel}
      />
    </form>
  );
}
