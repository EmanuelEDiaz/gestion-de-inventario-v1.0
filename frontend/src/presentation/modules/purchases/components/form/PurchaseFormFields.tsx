'use client';

import { useEffect, useState } from 'react';
import { createPurchaseSchema } from '@/core/validators/purchase-validators';
import { validateFormData } from '@/core/validators/shared/validate-and-submit';
import type { CreatePurchaseInput } from '@/core/purchase/entities/purchase';
import { useReferenceData } from '@/presentation/shared/hooks/api/useReferenceData';
import { DynamicArrayLines, type Column } from '@/presentation/shared/components/form/DynamicArrayLines';
import { PurchaseSupplierSelector } from './PurchaseSupplierSelector';
import { PurchaseSummary } from './PurchaseSummary';

interface PurchaseFormFieldsProps {
  onSubmit: (data: CreatePurchaseInput) => void;
  onContinue?: (data: CreatePurchaseInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  prefillSupplierId?: string;
}

const STORAGE_KEY = 'purchase-create';
const emptyLine = (): Record<string, string> => ({ productId: '', quantity: '1', unitCost: '' });

const COLUMNS: Column[] = [
  { key: 'productId', label: 'Producto', type: 'product' },
  { key: 'quantity', label: 'Cantidad', type: 'number', min: 1 },
  { key: 'unitCost', label: 'C.Unit', type: 'number', min: 0, step: '0.01' },
];

export function PurchaseFormFields({ onSubmit, onContinue, isSubmitting, onCancel, prefillSupplierId }: PurchaseFormFieldsProps) {
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierId, setSupplierId] = useState(prefillSupplierId || '');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Record<string, string>[]>([emptyLine()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [shouldContinue, setShouldContinue] = useState(false);

  const { warehouses, products, suppliers } = useReferenceData({ withSuppliers: true });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.warehouseId) setWarehouseId(parsed.warehouseId);
        if (parsed.supplierId) setSupplierId(parsed.supplierId);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.lines && Array.isArray(parsed.lines) && parsed.lines.length > 0) setLines(parsed.lines);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ warehouseId, supplierId, notes, lines }));
  }, [warehouseId, supplierId, notes, lines]);

  const updateLine = (i: number, field: string, value: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => {
    if (lines.length > 1) setLines((prev) => prev.filter((_, idx) => idx !== i));
  };

  const resetForm = () => {
    setWarehouseId('');
    setSupplierId('');
    setNotes('');
    setLines([emptyLine()]);
    setFieldErrors({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const rawValues: Record<string, unknown> = {
      warehouseId,
      supplierId: supplierId || undefined,
      notes: notes || undefined,
      purchaseDate: new Date().toISOString(),
      currencyCode: 'ARS',
      lines: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitCost: l.unitCost,
      })),
    };

    const result = validateFormData(createPurchaseSchema, rawValues);
    if (!result.success) {
      setFieldErrors(result.fieldErrors);
      return;
    }

    if (shouldContinue && onContinue) {
      resetForm();
      onContinue(result.data);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      onSubmit(result.data);
    }
    setShouldContinue(false);
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
        warehouseError={fieldErrors.warehouseId}
        supplierError={fieldErrors.supplierId}
      />
      <DynamicArrayLines
        lines={lines}
        products={products}
        columns={COLUMNS}
        fieldErrors={fieldErrors}
        onUpdate={updateLine}
        onAdd={addLine}
        onRemove={removeLine}
        sectionTitle="Líneas de Compra"
        addButtonLabel="Línea"
      />
      <PurchaseSummary
        notes={notes}
        notesError={fieldErrors.notes}
        onNotesChange={setNotes}
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        showContinue={!!onContinue}
        onContinueClick={() => setShouldContinue(true)}
      />
    </form>
  );
}
