'use client';

import { useState, useEffect } from 'react';
import type { ReturnType as ReturnDocType, CreateReturnData } from '@/core/return/entities/return';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import type { Product } from '@/core/product/entities/product';
import { GetWarehousesUseCase } from '@/core/warehouse/use-cases/GetWarehousesUseCase';
import { GetProductsUseCase } from '@/core/product/use-cases/GetProductsUseCase';
import { WarehouseRepository } from '@/infrastructure/repositories/warehouse/WarehouseRepository';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { DynamicArrayLines } from '@/presentation/shared/components/form/DynamicArrayLines';
import type { Column } from '@/presentation/shared/components/form/DynamicArrayLines';
import { ReturnFormBasicFields } from './ReturnFormBasicFields';
import { ReturnFormActions } from './ReturnFormActions';
import { createReturnSchema } from '@/core/validators/return-validators';
import { validateFormData } from '@/core/validators/shared/validate-and-submit';

const STORAGE_KEY = 'return-create';

const emptyLine = (): Record<string, string> => ({
  productId: '', quantity: '1', unitPrice: '', unitCost: '',
});

const LINES_COLUMNS: Column[] = [
  { key: 'productId', label: 'Producto', type: 'product' },
  { key: 'quantity', label: 'Cantidad', type: 'number', min: 1 },
  { key: 'unitPrice', label: 'Precio', type: 'number', min: 0, step: '0.01' },
  { key: 'unitCost', label: 'Costo', type: 'number', min: 0, step: '0.01' },
];

interface ReturnFormFieldsProps {
  onSubmit: (data: CreateReturnData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function ReturnFormFields({ onSubmit, isSubmitting, onCancel }: ReturnFormFieldsProps) {
  const [type, setType] = useState<ReturnDocType>('SALE_RETURN');
  const [warehouseId, setWarehouseId] = useState('');
  const [originalDocumentId, setOriginalDocumentId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Record<string, string>[]>([emptyLine()]);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    new GetWarehousesUseCase(new WarehouseRepository()).execute().then(setWarehouses).catch(() => {});
    new GetProductsUseCase(new ProductRepository()).execute({ size: 200 }).then((r) => setProducts(r?.content ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data.type) setType(data.type);
      if (typeof data.warehouseId === 'string') setWarehouseId(data.warehouseId);
      if (typeof data.originalDocumentId === 'string') setOriginalDocumentId(data.originalDocumentId);
      if (typeof data.reason === 'string') setReason(data.reason);
      if (typeof data.notes === 'string') setNotes(data.notes);
      if (Array.isArray(data.lines)) setLines(data.lines);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const data = { type, warehouseId, originalDocumentId, reason, notes, lines };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [type, warehouseId, originalDocumentId, reason, notes, lines]);

  const updateLine = (i: number, field: string, value: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => { if (lines.length > 1) setLines((prev) => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nonEmptyLines = lines.filter((l) => l.productId);
    const raw = {
      type,
      warehouseId,
      originalDocumentId: originalDocumentId || undefined,
      reason: reason || undefined,
      notes: notes || undefined,
      lines: nonEmptyLines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        unitCost: l.unitCost || undefined,
      })),
    };

    const result = validateFormData(createReturnSchema, raw as Record<string, unknown>);
    if (!result.success) {
      setFieldErrors(result.fieldErrors);
      return;
    }

    setFieldErrors({});
    localStorage.removeItem(STORAGE_KEY);
    onSubmit({
      type: result.data.type,
      warehouseId: result.data.warehouseId,
      originalDocumentId: result.data.originalDocumentId,
      reason: result.data.reason,
      notes: result.data.notes,
      lines: result.data.lines,
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
        typeError={fieldErrors.type}
        warehouseError={fieldErrors.warehouseId}
        originalDocumentIdError={fieldErrors.originalDocumentId}
        reasonError={fieldErrors.reason}
      />
      <DynamicArrayLines
        lines={lines}
        products={products}
        columns={LINES_COLUMNS}
        fieldErrors={fieldErrors}
        onUpdate={updateLine}
        onAdd={addLine}
        onRemove={removeLine}
        sectionTitle="Productos a Devolver"
        addButtonLabel="Línea"
      />
      <ReturnFormActions
        notes={notes}
        isSubmitting={isSubmitting}
        onNotesChange={setNotes}
        onCancel={onCancel}
        notesError={fieldErrors.notes}
      />
    </form>
  );
}
