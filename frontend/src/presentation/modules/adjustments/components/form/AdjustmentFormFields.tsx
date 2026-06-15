'use client';

import { useState, useEffect } from 'react';
import type { CreateAdjustmentData } from '@/core/adjustment/entities/adjustment';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import type { Product } from '@/core/product/entities/product';
import { GetWarehousesUseCase } from '@/core/warehouse/use-cases/GetWarehousesUseCase';
import { GetProductsUseCase } from '@/core/product/use-cases/GetProductsUseCase';
import { WarehouseRepository } from '@/infrastructure/repositories/warehouse/WarehouseRepository';
import { ProductRepository } from '@/infrastructure/repositories/product/ProductRepository';
import { createAdjustmentSchema } from '@/core/validators/adjustment-validators';
import { validateFormData } from '@/core/validators/shared/validate-and-submit';
import { DynamicArrayLines, type Column } from '@/presentation/shared/components/form/DynamicArrayLines';
import { AdjustmentHeaderFields } from './AdjustmentHeaderFields';
import { AdjustmentReasonField } from './AdjustmentReasonField';
import { AdjustmentNotesField } from './AdjustmentNotesField';
import { AdjustmentFormActions } from './AdjustmentFormActions';

interface AdjustmentFormFieldsProps {
  onSubmit: (data: CreateAdjustmentData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const STORAGE_KEY = 'adjustment-create';
const emptyLine = (): Record<string, string> => ({ productId: '', systemQty: '0', countedQty: '0' });

const COLUMNS: Column[] = [
  { key: 'productId', label: 'Producto', type: 'product' },
  { key: 'systemQty', label: 'Sist.', type: 'number', min: 0 },
  { key: 'countedQty', label: 'Contado', type: 'number', min: 0 },
];

export function AdjustmentFormFields({ onSubmit, isSubmitting, onCancel }: AdjustmentFormFieldsProps) {
  const [warehouseId, setWarehouseId] = useState('');
  const [type, setType] = useState('');
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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.warehouseId) setWarehouseId(parsed.warehouseId);
        if (parsed.type) setType(parsed.type);
        if (parsed.reason) setReason(parsed.reason);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.lines && Array.isArray(parsed.lines) && parsed.lines.length > 0) setLines(parsed.lines);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ warehouseId, type, reason, notes, lines }));
  }, [warehouseId, type, reason, notes, lines]);

  const updateLine = (i: number, field: string, value: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => { if (lines.length > 1) setLines((prev) => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const rawValues: Record<string, unknown> = {
      warehouseId,
      type,
      reason: reason || undefined,
      notes: notes || undefined,
      adjustmentDate: new Date().toISOString(),
      lines: lines.map((l) => ({
        productId: l.productId,
        systemQty: l.systemQty,
        countedQty: l.countedQty,
      })),
    };

    const result = validateFormData(createAdjustmentSchema, rawValues);
    if (!result.success) {
      setFieldErrors(result.fieldErrors);
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    onSubmit(result.data as CreateAdjustmentData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AdjustmentHeaderFields
        warehouses={warehouses}
        warehouseId={warehouseId}
        onWarehouseChange={setWarehouseId}
        type={type}
        onTypeChange={(val) => setType(val)}
        warehouseError={fieldErrors.warehouseId}
        typeError={fieldErrors.type}
      />

      <AdjustmentReasonField value={reason} onChange={setReason} reasonError={fieldErrors.reason} />

      <DynamicArrayLines
        lines={lines}
        products={products}
        columns={COLUMNS}
        fieldErrors={fieldErrors}
        onUpdate={updateLine}
        onAdd={addLine}
        onRemove={removeLine}
        sectionTitle="Líneas de Ajuste"
        addButtonLabel="Línea"
      />

      <AdjustmentNotesField value={notes} onChange={setNotes} notesError={fieldErrors.notes} />

      <AdjustmentFormActions isSubmitting={isSubmitting} onCancel={onCancel} />
    </form>
  );
}
