'use client';

import { useState } from 'react';
import type { CreateSaleInput } from '@/core/entities/sale';
import { useReferenceData } from '@/presentation/shared/hooks/useReferenceData';
import { SaleCustomerSelector } from './SaleCustomerSelector';
import { SaleLinesSection } from './SaleLinesSection';
import { SaleSummary } from './SaleSummary';

interface SaleLineInput {
  productId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
}

interface SaleFormFieldsProps {
  onSubmit: (data: CreateSaleInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const emptyLine = (): SaleLineInput => ({
  productId: '', quantity: '1', unitPrice: '', discount: '0',
});

export function SaleFormFields({ onSubmit, isSubmitting, onCancel }: SaleFormFieldsProps) {
  const [warehouseId, setWarehouseId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<SaleLineInput[]>([emptyLine()]);

  const { warehouses, products, customers } = useReferenceData({ withCustomers: true });

  const updateLine = (index: number, field: keyof SaleLineInput, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (index: number) => {
    if (lines.length > 1) setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      warehouseId,
      customerId: customerId || undefined,
      notes: notes || undefined,
      lines: lines
        .filter((l) => l.productId && l.unitPrice)
        .map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discount: Number(l.discount) || undefined,
        })),
    });
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
      />
      <SaleLinesSection
        lines={lines}
        products={products}
        onUpdate={updateLine}
        onRemove={removeLine}
        onAdd={addLine}
      />
      <SaleSummary
        notes={notes}
        isSubmitting={isSubmitting}
        onNotesChange={setNotes}
        onCancel={onCancel}
      />
    </form>
  );
}
