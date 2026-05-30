'use client';

import { useState } from 'react';
import { useSupplierCatalog } from '../hooks/useSupplierCatalog';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { LoadingSpinner } from '@/presentation/shared/components/form/LoadingSpinner';
import { EmptyState } from '@/presentation/shared/components/data-display/EmptyState';
import { toast } from '@/presentation/shared/components/ui/toast';
import { Plus } from '@/presentation/shared/components/ui/icon-mapping';
import { CatalogAddForm } from './CatalogAddForm';
import { CatalogTable } from './CatalogTable';

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
        <TooltipWrapper content="Agregar producto al catálogo">
          <Button size="sm" onClick={() => setShowForm(!showForm)} title="Agregar producto al catálogo">
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </TooltipWrapper>
      </div>

      {showForm && (
        <CatalogAddForm
          description={description}
          unitPrice={unitPrice}
          currencyCode={currencyCode}
          onDescriptionChange={setDescription}
          onUnitPriceChange={setUnitPrice}
          onCurrencyCodeChange={setCurrencyCode}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
          isPending={add.isPending}
        />
      )}

      {products.length === 0 && !showForm && <EmptyState message="Sin productos en el catálogo" />}
      <CatalogTable products={products} onRemove={handleRemove} />
    </div>
  );
}
