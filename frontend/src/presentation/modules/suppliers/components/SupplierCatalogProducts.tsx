'use client';

import { useState } from 'react';
import { useSupplierCatalog } from '../hooks/useSupplierCatalog';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Input } from '@/presentation/shared/components/ui/Input';
import { LoadingSpinner } from '@/presentation/shared/components/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/EmptyState';
import { toast } from '@/presentation/shared/components/ui/toast';
import { Plus, Trash2 } from 'lucide-react';

interface SupplierCatalogProductsProps {
  supplierId: string;
}

export function SupplierCatalogProducts({ supplierId }: SupplierCatalogProductsProps) {
  const { products, isLoading, add, remove } = useSupplierCatalog(supplierId);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');

  const handleAdd = async () => {
    if (!description.trim()) return;
    try {
      await add.mutateAsync({
        description: description.trim(),
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        currencyCode: currencyCode.trim() || undefined,
      });
      toast.success('Producto agregado al catálogo');
      setDescription('');
      setUnitPrice('');
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al agregar producto');
    }
  };

  const handleRemove = async (catalogProductId: string) => {
    try {
      await remove.mutateAsync(catalogProductId);
      toast.success('Producto eliminado del catálogo');
    } catch {
      toast.error('Error al eliminar producto');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{products.length} producto(s)</span>
        <Button size="sm" onClick={() => setShowForm(!showForm)} title="Agregar producto al catálogo">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-3 space-y-3 bg-gray-50">
          <Input
            label="Descripción del producto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ej: Tornillos M6 x 20mm"
            title="Nombre o descripción del producto en el catálogo del proveedor"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Precio unitario (opcional)"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00"
              title="Precio unitario ofrecido por el proveedor"
            />
            <Input
              label="Moneda (opcional)"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              placeholder="USD"
              maxLength={3}
              title="Código de moneda (ej: USD, PEN, EUR)"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} title="Cancelar">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!description.trim() || add.isPending}
              title="Guardar producto en catálogo"
            >
              {add.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      )}

      {products.length === 0 && !showForm && <EmptyState message="Sin productos en el catálogo" />}

      <div className="divide-y rounded-lg border">
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" title={p.description || ''}>
                {p.description || '(sin descripción)'}
              </p>
              {p.unitPrice != null && (
                <p className="text-xs text-gray-500">
                  {p.unitPrice} {p.currencyCode || ''}
                </p>
              )}
            </div>
            <button
              className="ml-2 p-1 rounded hover:bg-red-50"
              onClick={() => handleRemove(p.id)}
              title="Eliminar del catálogo"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
