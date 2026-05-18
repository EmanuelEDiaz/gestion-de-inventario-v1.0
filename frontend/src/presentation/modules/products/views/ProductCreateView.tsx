/**
 * ProductCreateView - Composition view for product create page
 */

'use client';

import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui';
import { AlertMessage } from '@/presentation/shared/components/AlertMessage';
import { Card } from '@/presentation/shared/components/ui/card';
import { ProductFormFields, type ProductFormData } from '../components/form/ProductFormFields';
import { ProductCreateImageCarousel } from '../components/ProductCreateImageCarousel';
import { useProductFormController } from '../hooks/useProductFormController';
import { useCategories } from '../hooks/useCategories';
import type { CreateProductData } from '@/core/entities/product';

const INITIAL_FORM_DATA: ProductFormData = {
  name: '',
  sku: '',
  barcode: '',
  description: '',
  categoryId: '',
  standardCost: '',
  salePrice: '',
  reorderPoint: '',
  taxRate: '0',
  unitOfMeasure: 'UNIT',
};

export function ProductCreateView() {
  const { isLoading, error, handleSubmit, clearError, goBack } = useProductFormController();
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [files, setFiles] = useState<File[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const { data: categories = [] } = useCategories(true);

  const handleFieldChange = useCallback((field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const payload: CreateProductData = {
        name: formData.name,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        description: formData.description || undefined,
        categoryId: formData.categoryId || undefined,
        standardCost: formData.standardCost ? parseFloat(formData.standardCost) : undefined,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        reorderPoint: formData.reorderPoint ? parseFloat(formData.reorderPoint) : undefined,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : 0,
        unitOfMeasure: formData.unitOfMeasure,
      };
      handleSubmit(payload, { files, primaryIndex });
    },
    [files, formData, handleSubmit, primaryIndex]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl bg-linear-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Nuevo Producto</h1>
        </div>
        <p className="mt-1 text-blue-50">Completa datos e imágenes: hasta 8 fotos con una principal para tu catálogo.</p>
      </div>

      {error && <AlertMessage message={error} onDismiss={clearError} />}

      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <ProductFormFields data={formData} categories={categories} onChange={handleFieldChange} />
            <ProductCreateImageCarousel
              files={files}
              primaryIndex={primaryIndex}
              onChange={(nextFiles, nextPrimary) => {
                setFiles(nextFiles);
                setPrimaryIndex(nextPrimary);
              }}
            />
          </div>
          <div className="flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="secondary" onClick={goBack} title="Cancelar creación del producto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} title="Guardar producto y subir sus imágenes">
              {isLoading ? 'Guardando...' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
