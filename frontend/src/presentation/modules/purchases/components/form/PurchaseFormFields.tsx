'use client';

import { useState, useEffect } from 'react';
import type { CreatePurchaseInput } from '@/core/entities/purchase';
import type { Warehouse } from '@/core/entities/warehouse';
import type { Supplier } from '@/core/entities/supplier';
import type { Product } from '@/core/entities/product';
import { GetWarehousesUseCase } from '@/core/use-cases/warehouse/GetWarehousesUseCase';
import { GetSuppliersUseCase } from '@/core/use-cases/supplier/get-suppliers';
import { GetProductsUseCase } from '@/core/use-cases/product/GetProductsUseCase';
import { WarehouseRepository } from '@/infrastructure/repositories/WarehouseRepository';
import { SupplierRepository } from '@/infrastructure/repositories/SupplierRepository';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { Textarea } from '@/presentation/shared/components/Textarea';
import { Trash2, Plus } from 'lucide-react';

interface PurchaseLineInput {
  productId: string;
  quantity: string;
  unitCost: string;
}

interface PurchaseFormFieldsProps {
  onSubmit: (data: CreatePurchaseInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const emptyLine = (): PurchaseLineInput => ({ productId: '', quantity: '1', unitCost: '' });

export function PurchaseFormFields({ onSubmit, isSubmitting, onCancel }: PurchaseFormFieldsProps) {
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PurchaseLineInput[]>([emptyLine()]);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    new GetWarehousesUseCase(new WarehouseRepository()).execute().then(setWarehouses).catch(() => {});
    new GetSuppliersUseCase(new SupplierRepository()).execute().then(setSuppliers).catch(() => {});
    new GetProductsUseCase(new ProductRepository()).execute({ size: 200 }).then((r) => setProducts(r?.content ?? [])).catch(() => {});
  }, []);

  const updateLine = (i: number, field: keyof PurchaseLineInput, value: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => { if (lines.length > 1) setLines((prev) => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      warehouseId,
      supplierId: supplierId || undefined,
      notes: notes || undefined,
      lines: lines.filter((l) => l.productId && l.unitCost).map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="warehouseId" className="text-sm font-medium">Almacén *</label>
          <select
            id="warehouseId"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            title="Almacén destino de la compra"
          >
            <option value="">{warehouses.length === 0 ? 'No hay almacenes disponibles' : '-- Seleccionar almacén --'}</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="supplierId" className="text-sm font-medium">Proveedor</label>
          <select
            id="supplierId"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            title="Proveedor de la compra"
          >
            <option value="">{suppliers.length === 0 ? 'No hay proveedores disponibles' : '-- Sin proveedor --'}</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Líneas de Compra</h3>
          <Button type="button" size="sm" variant="outline" onClick={addLine} title="Agregar línea"><Plus className="h-4 w-4 mr-1" /> Línea</Button>
        </div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_100px_40px] gap-2 items-end">
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
              <div className="space-y-1">
                {i === 0 && <label className="text-xs text-muted-foreground">Costo</label>}
                <Input type="number" step="0.01" min="0" value={line.unitCost} onChange={(e) => updateLine(i, 'unitCost', e.target.value)} required title="Costo unitario" />
              </div>
              <button type="button" onClick={() => removeLine(i)} className="p-2 text-red-500 hover:text-red-700" title="Eliminar línea" disabled={lines.length === 1}>
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
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Compra'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
