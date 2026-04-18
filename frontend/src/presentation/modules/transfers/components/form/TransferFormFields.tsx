'use client';

import { useState, useEffect } from 'react';
import type { CreateTransferRequest } from '@/core/entities/transfer';
import type { Warehouse } from '@/core/entities/warehouse';
import type { Product } from '@/core/entities/product';
import { GetWarehousesUseCase } from '@/core/use-cases/warehouse/GetWarehousesUseCase';
import { GetProductsUseCase } from '@/core/use-cases/product/GetProductsUseCase';
import { WarehouseRepository } from '@/infrastructure/repositories/WarehouseRepository';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Textarea } from '@/presentation/shared/components/Textarea';
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

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    new GetWarehousesUseCase(new WarehouseRepository()).execute().then(setWarehouses).catch(() => {});
    new GetProductsUseCase(new ProductRepository()).execute({ size: 200 }).then((r) => setProducts(r?.content ?? [])).catch(() => {});
  }, []);

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
          <select
            id="fromWarehouseId"
            value={fromWarehouseId}
            onChange={(e) => setFromWarehouseId(e.target.value)}
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            title="Almacén de origen"
          >
            <option value="">{warehouses.length === 0 ? 'No hay almacenes disponibles' : '-- Seleccionar origen --'}</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="toWarehouseId" className="text-sm font-medium">Almacén Destino *</label>
          <select
            id="toWarehouseId"
            value={toWarehouseId}
            onChange={(e) => setToWarehouseId(e.target.value)}
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            title="Almacén de destino"
          >
            <option value="">{warehouses.length === 0 ? 'No hay almacenes disponibles' : '-- Seleccionar destino --'}</option>
            {warehouses.filter((w) => w.id !== fromWarehouseId).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
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
                <select
                  value={line.productId}
                  onChange={(e) => updateLine(i, 'productId', e.target.value)}
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  title="Producto"
                >
                  <option value="">{products.length === 0 ? 'No hay productos' : '-- Producto --'}</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.sku ? `${p.sku} - ` : ''}{p.name}</option>)}
                </select>
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
