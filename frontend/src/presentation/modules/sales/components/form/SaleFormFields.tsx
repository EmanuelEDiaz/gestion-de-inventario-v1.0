'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CreateSaleInput } from '@/core/sale/entities/sale';
import { useReferenceData } from '@/presentation/shared/hooks/api/useReferenceData';
import { SaleCustomerSelector } from './SaleCustomerSelector';
import { SaleSummary } from './SaleSummary';
import { DynamicArrayLines } from '@/presentation/shared/components/form/DynamicArrayLines';
import { createSaleSchema } from '@/core/validators/sale-validators';
import { validateFormData } from '@/core/validators/shared/validate-and-submit';
import type { Column } from '@/presentation/shared/components/form/DynamicArrayLines';

interface SaleFormFieldsProps {
  onSubmit: (data: CreateSaleInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const STORAGE_KEY = 'sale-create';

const emptyLine = (): Record<string, string> => ({
  productId: '', quantity: '1', unitPrice: '', discount: '0',
});

const COLUMNS: Column[] = [
  { key: 'productId', label: 'Producto', type: 'product' },
  { key: 'quantity', label: 'Cantidad', type: 'number', min: 1 },
  { key: 'unitPrice', label: 'Precio', type: 'number', min: 0, step: '0.01' },
  { key: 'discount', label: 'Dto %', type: 'number', min: 0, step: '0.01' },
];

export function SaleFormFields({ onSubmit, isSubmitting, onCancel }: SaleFormFieldsProps) {
  const [warehouseId, setWarehouseId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Record<string, string>[]>([emptyLine()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { warehouses, products, customers } = useReferenceData({ withCustomers: true });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.warehouseId === 'string') setWarehouseId(parsed.warehouseId);
        if (typeof parsed.customerId === 'string') setCustomerId(parsed.customerId);
        if (typeof parsed.notes === 'string') setNotes(parsed.notes);
        if (Array.isArray(parsed.lines)) setLines(parsed.lines);
      }
    } catch { /* ignore */ }
  }, []);

  const saveToStorage = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ warehouseId, customerId, notes, lines }));
  }, [warehouseId, customerId, notes, lines]);

  useEffect(() => { saveToStorage(); }, [saveToStorage]);

  const updateLine = (index: number, field: string, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (index: number) => {
    if (lines.length > 1) setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const rawValues: Record<string, unknown> = {
      warehouseId,
      customerId: customerId || undefined,
      notes: notes || undefined,
      lines: lines
        .filter((l) => l.productId && l.unitPrice)
        .map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount || undefined,
        })),
    };

    const result = validateFormData(createSaleSchema, rawValues);
    if (!result.success) {
      setFieldErrors(result.fieldErrors);
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SaleCustomerSelector
        warehouses={warehouses}
        warehouseId={warehouseId}
        onWarehouseChange={setWarehouseId}
        customers={customers}
        customerId={customerId}
        onCustomerChange={setCustomerId}
        warehouseError={fieldErrors['warehouseId']}
        customerError={fieldErrors['customerId']}
      />
      <DynamicArrayLines
        lines={lines}
        products={products}
        columns={COLUMNS}
        fieldErrors={fieldErrors}
        onUpdate={updateLine}
        onAdd={addLine}
        onRemove={removeLine}
        sectionTitle="Líneas"
        addButtonLabel="Línea"
      />
      <SaleSummary
        notes={notes}
        isSubmitting={isSubmitting}
        onNotesChange={setNotes}
        onCancel={onCancel}
        notesError={fieldErrors['notes']}
      />
    </form>
  );
}
