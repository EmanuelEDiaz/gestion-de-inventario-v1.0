'use client';

import { useState, useEffect } from 'react';
import type { CreateTransferRequest } from '@/core/transfer/entities/transfer';
import { useReferenceData } from '@/presentation/shared/hooks/api/useReferenceData';
import { Button, TooltipWrapper } from '@/presentation/shared/components/ui';
import { Textarea } from '@/presentation/shared/components/form/Textarea';
import { TransferOriginFields } from './TransferOriginFields';
import { TransferDestinationFields } from './TransferDestinationFields';
import { DynamicArrayLines } from '@/presentation/shared/components/form/DynamicArrayLines';
import { createTransferSchema } from '@/core/validators/transfer-validators';
import { validateFormData } from '@/core/validators/shared/validate-and-submit';

const STORAGE_KEY = 'transfer-create';

const emptyLine = (): Record<string, string> => ({ productId: '', quantity: '1' });

const columns = [
  { key: 'productId', label: 'Producto', type: 'product' as const },
  { key: 'quantity', label: 'Cantidad', type: 'number' as const, min: 1 },
];

interface TransferFormFieldsProps {
  onSubmit: (data: CreateTransferRequest) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function TransferFormFields({ onSubmit, isSubmitting, onCancel }: TransferFormFieldsProps) {
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Record<string, string>[]>([emptyLine()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { warehouses, products } = useReferenceData();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFromWarehouseId(parsed.fromWarehouseId ?? '');
        setToWarehouseId(parsed.toWarehouseId ?? '');
        setNotes(parsed.notes ?? '');
        setLines(parsed.lines ?? [emptyLine()]);
      } catch { /* empty */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fromWarehouseId, toWarehouseId, notes, lines }));
  }, [fromWarehouseId, toWarehouseId, notes, lines]);

  const updateLine = (i: number, field: string, value: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => { if (lines.length > 1) setLines((prev) => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawValues: Record<string, unknown> = {
      fromWarehouseId,
      toWarehouseId,
      notes: notes || undefined,
      transferDate: new Date().toISOString().split('T')[0],
      lines: lines.filter((l) => l.productId).map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      })),
    };
    const result = validateFormData(createTransferSchema, rawValues);
    if (!result.success) {
      setFieldErrors(result.fieldErrors);
      return;
    }
    setFieldErrors({});
    localStorage.removeItem(STORAGE_KEY);
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
        <TransferOriginFields
          warehouses={warehouses}
          value={fromWarehouseId}
          onChange={setFromWarehouseId}
          fromWarehouseError={fieldErrors.fromWarehouseId}
        />
        <TransferDestinationFields
          warehouses={warehouses}
          fromWarehouseId={fromWarehouseId}
          value={toWarehouseId}
          onChange={setToWarehouseId}
          toWarehouseError={fieldErrors.toWarehouseId}
        />
      </div>
      <DynamicArrayLines
        lines={lines}
        products={products}
        columns={columns}
        fieldErrors={fieldErrors}
        onUpdate={updateLine}
        onAdd={addLine}
        onRemove={removeLine}
        sectionTitle="Productos a Transferir"
        addButtonLabel="Línea"
      />
      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notas</label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} />
        {fieldErrors.notes && <p className="text-sm text-red-500">{fieldErrors.notes}</p>}
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
