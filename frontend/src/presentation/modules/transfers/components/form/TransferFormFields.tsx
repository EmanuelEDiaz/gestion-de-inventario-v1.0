'use client';

import { useState } from 'react';
import type { CreateTransferRequest } from '@/core/transfer/entities/transfer';
import type { Warehouse } from '@/core/warehouse/entities/warehouse';
import type { Product } from '@/core/product/entities/product';
import { useReferenceData } from '@/presentation/shared/hooks/api/useReferenceData';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Textarea } from '@/presentation/shared/components/form/Textarea';
import { ComboboxSelect } from '@/presentation/shared/components/form/ComboboxSelect';
import { Trash2, Plus } from 'lucide-react';

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
        <div className="space-y-1">
          <label htmlFor="fromWarehouseId" className="text-sm font-medium">Almacén Origen *</label>
          <ComboboxSelect
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            value={fromWarehouseId}
            onChange={setFromWarehouseId}
            placeholder={warehouses.length === 0 ? 'No hay almacenes' : 'Seleccionar origen...'}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="toWarehouseId" className="text-sm font-medium">Almacén Destino *</label>
          <ComboboxSelect
            options={warehouses.filter((w) => w.id !== fromWarehouseId).map((w) => ({ value: w.id, label: w.name }))}
            value={toWarehouseId}
            onChange={setToWarehouseId}
            placeholder={warehouses.length === 0 ? 'No hay almacenes' : 'Seleccionar destino...'}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Productos a Transferir</h3>
          <Button type="button" size="sm" variant="outline" onClick={addLine} title="Agregar producto"><Plus className="h-4 w-4 mr-1" /> Línea</Button>
        </div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_40px] gap-2 items-end">
              <div className="space-y-1">
                {i === 0 && <label className="text-xs text-muted-foreground">Producto</label>}
                <ComboboxSelect
                  options={products.map((p) => ({ value: p.id, label: p.sku ? `${p.sku} - ${p.name}` : p.name }))}
                  value={line.productId}
                  onChange={(val) => updateLine(i, 'productId', val)}
                  placeholder={products.length === 0 ? 'No hay productos' : 'Seleccionar...'}
                />
              </div>
              <div className="space-y-1">
                {i === 0 && <label className="text-xs text-muted-foreground">Cant.</label>}
                <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} required title="Cantidad" />
              </div>
              <button type="button" onClick={() => removeLine(i)} className="p-2 text-red-500 hover:text-red-700" title="Eliminar" disabled={lines.length === 1}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notas</label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Transferencia'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
