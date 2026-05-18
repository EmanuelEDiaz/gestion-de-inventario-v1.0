'use client';

import { useState } from 'react';
import type { CreateSaleInput } from '@/core/entities/sale';
import type { Warehouse } from '@/core/entities/warehouse';
import type { Customer } from '@/core/entities/customer';
import type { Product } from '@/core/entities/product';
import { useReferenceData } from '@/presentation/shared/hooks/useReferenceData';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Textarea } from '@/presentation/shared/components/Textarea';
import { ComboboxSelect } from '@/presentation/shared/components/ComboboxSelect';
import { Trash2, Plus } from 'lucide-react';

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
  productId: '',
  quantity: '1',
  unitPrice: '',
  discount: '0',
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="warehouseId" className="text-sm font-medium">Almacén *</label>
          <ComboboxSelect
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            value={warehouseId}
            onChange={setWarehouseId}
            placeholder={warehouses.length === 0 ? 'No hay almacenes' : 'Seleccionar...'}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="customerId" className="text-sm font-medium">Cliente</label>
          <ComboboxSelect
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
            value={customerId}
            onChange={setCustomerId}
            placeholder={customers.length === 0 ? 'No hay clientes' : 'Sin cliente...'}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Líneas de Venta</h3>
          <Button type="button" size="sm" variant="outline" onClick={addLine} title="Agregar línea de producto">
            <Plus className="h-4 w-4 mr-1" /> Línea
          </Button>
        </div>

        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_100px_80px_40px] gap-2 items-end">
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
                <Input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                  required
                  title="Cantidad"
                />
              </div>
              <div className="space-y-1">
                {i === 0 && <label className="text-xs text-muted-foreground">Precio</label>}
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(i, 'unitPrice', e.target.value)}
                  required
                  title="Precio unitario"
                />
              </div>
              <div className="space-y-1">
                {i === 0 && <label className="text-xs text-muted-foreground">Desc.</label>}
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.discount}
                  onChange={(e) => updateLine(i, 'discount', e.target.value)}
                  title="Descuento"
                />
              </div>
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="p-2 text-red-500 hover:text-red-700"
                title="Eliminar línea"
                disabled={lines.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notas</label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionales..."
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear Venta'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
